import { consumableMaterialRepository } from './consumableMaterial.repository.js';
import { deleteFiles, parseOrden, resolverOrden } from '../../shared/orderedFiles.js';
import { quotationService, parseQuotationIds } from '../quotations/quotation.service.js';

// Topes por material. Multer ya corta al subir, pero la edición puede combinar
// archivos conservados + nuevos y ahí no interviene multer.
const MAX_IMAGENES = 3;
const MAX_FICHAS = 3;

// La ficha técnica es obligatoria, igual que en el material devolutivo: el
// material de consumo la recibió (p48) con el mismo contrato en BD, backend y UI.
//
// ⚠ Los materiales de consumo creados ANTES de p48 no tienen ninguna, así que no
// se podrán editar hasta que se les suba una o se recreen. Es una consecuencia
// aceptada: los registros previos son de prueba y se van a rehacer.
const MIN_FICHAS = 1;
// La imagen también es obligatoria: todos los materiales existentes tienen una
// (la migración p48 trasladó la columna `image` a la tabla de imágenes).
const MIN_IMAGENES = 1;

const aImagen = (file, sortOrder) => ({
  imageUrl: `/uploads/${file.filename}`,
  fileName: file.originalname,
  mimeType: file.mimetype,
  sortOrder,
});

const aFicha = (file, sortOrder) => ({
  fileUrl:  `/uploads/${file.filename}`,
  fileName: file.originalname,
  mimeType: file.mimetype,
  sortOrder,
});

// Los cuentadantes viajan como JSON dentro del multipart, igual que imageOrder y
// sheetOrder: un FormData no puede llevar un array sin serializarlo.
// (p50) Cotizaciones: la regla y el parseo viven en su propio módulo; aquí solo
// se consumen. Un material necesita entre 1 y 3 para poder guardarse.
const parseCotizaciones = parseQuotationIds;

const parseAccountables = (raw) => {
  if (raw === undefined || raw === '') return undefined; // la edición no los tocó
  let lista;
  try {
    lista = JSON.parse(raw);
    if (!Array.isArray(lista)) throw new Error();
  } catch {
    throw new Error('La lista de cuentadantes es inválida.');
  }
  const ids = [...new Set(lista.map(Number))];
  if (ids.some((n) => !Number.isInteger(n) || n <= 0)) {
    throw new Error('La lista de cuentadantes contiene identificadores inválidos.');
  }
  return ids;
};

const parseNumericos = (data) => ({
  ...data,
  // (p48) La marca es opcional, así que hay que poder QUITÁRSELA a un material
  // que ya la tenía: el campo vacío significa "no tiene" y viaja como null.
  // Con `undefined` (que es lo que hay que mandar para "no lo toqué") Prisma
  // ignora la columna y la marca vieja se quedaba pegada para siempre.
  brandId:      data.brandId === '' ? null : (data.brandId ? Number(data.brandId) : undefined),
  inventoryId:  data.inventoryId ? Number(data.inventoryId) : undefined,
  // (p48) Vacío = "no tiene", igual que la marca. Es lo que permite convertir un
  // material serializado en uno por cantidad y al revés. Con `undefined` (que es
  // lo que significa "no lo toqué") Prisma ignora la columna y el valor viejo se
  // quedaba pegado, dejando materiales con placa Y cantidad a la vez.
  quantity:     data.quantity  === '' ? null : (data.quantity !== undefined ? Number(data.quantity) : undefined),
  senaPlate:    data.senaPlate === '' ? null : data.senaPlate,
  unitPrice:    data.unitPrice   ? Number(data.unitPrice)   : undefined,
  totalPrice:   data.totalPrice  ? Number(data.totalPrice)  : undefined,
  purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString() : undefined,
  entryDate:    data.entryDate    ? new Date(data.entryDate).toISOString()    : undefined,
});

// Comprueba que cada id sea un usuario activo de tipo Cuentadante. Sin esto, un id
// inexistente saldría como violación de clave foránea, que al usuario no le dice nada.
const validarCuentadantes = async (ids) => {
  if (!ids.length) throw new Error('Debe asignar al menos un cuentadante.');
  const validos = await consumableMaterialRepository.findValidAccountables(ids);
  if (validos.length !== ids.length) {
    throw new Error('Alguno de los cuentadantes seleccionados no existe, está inactivo o no es cuentadante.');
  }
};

export const consumableMaterialService = {
  async getAll(status) {
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    return consumableMaterialRepository.findAll(filter);
  },

  async getById(id) {
    const material = await consumableMaterialRepository.findById(id);
    if (!material) throw new Error('Material de consumo no encontrado.');
    if (material.returnable) throw new Error('Este material es devolutivo. Usa /returnable-materials.');
    return material;
  },

  async create(bodyData, files) {
    const imagenes = files?.image ?? [];
    const fichas   = files?.technical_sheet ?? [];

    // Rutas de TODO lo subido: si la validación falla, ningún archivo debe quedar
    // huérfano en /uploads
    const subidos = [...imagenes, ...fichas].map((f) => `/uploads/${f.filename}`);

    const abortar = (mensaje) => { deleteFiles(subidos); throw new Error(mensaje); };

    if (imagenes.length < MIN_IMAGENES) abortar('La imagen es requerida.');
    if (imagenes.length > MAX_IMAGENES) abortar(`Solo se permiten hasta ${MAX_IMAGENES} imágenes.`);
    if (fichas.length < MIN_FICHAS)     abortar('La ficha técnica es requerida.');
    if (fichas.length > MAX_FICHAS)     abortar(`Solo se permiten hasta ${MAX_FICHAS} fichas técnicas.`);

    const data = parseNumericos(bodyData);
    const accountableIds = parseAccountables(data.accountableIds);
    delete data.accountableIds;
    // imageOrder/sheetOrder no son campos del material: en create el orden es el
    // de subida, así que se descartan si llegaran
    delete data.imageOrder;
    delete data.sheetOrder;

    // (p50) Cotizaciones que respaldan el precio: obligatorias al crear.
    const quotationIds = parseCotizaciones(data.quotationIds);
    delete data.quotationIds;

    if (accountableIds === undefined) abortar('Debe asignar al menos un cuentadante.');
    try {
      await validarCuentadantes(accountableIds);
    } catch (err) {
      abortar(err.message);
    }

    let cotizaciones;
    try {
      cotizaciones = await quotationService.validarAsignacion(quotationIds ?? []);
    } catch (err) {
      abortar(err.message);
    }

    try {
      const created = await consumableMaterialRepository.create(
        data,
        accountableIds,
        imagenes.map((f, i) => aImagen(f, i)),
        fichas.map((f, i) => aFicha(f, i)),
        cotizaciones,
      );
      return created;
    } catch (err) {
      deleteFiles(subidos);
      throw err;
    }
  },

  async update(id, bodyData, files) {
    const actual = await consumableMaterialService.getById(id);

    const nuevasImagenes = files?.image ?? [];
    const nuevasFichas   = files?.technical_sheet ?? [];
    const nuevasRutas    = [...nuevasImagenes, ...nuevasFichas].map((f) => `/uploads/${f.filename}`);

    const data = parseNumericos(bodyData);

    // Estos tres no son columnas del material: se sacan antes del update de Prisma
    const ordenImagenes = parseOrden(data.imageOrder, 'las imágenes');
    const ordenFichas   = parseOrden(data.sheetOrder, 'las fichas técnicas');
    const accountableIds = parseAccountables(data.accountableIds);
    const quotationIds   = parseCotizaciones(data.quotationIds);
    delete data.imageOrder;
    delete data.sheetOrder;
    delete data.accountableIds;
    delete data.quotationIds;

    try {
      if (accountableIds !== undefined) await validarCuentadantes(accountableIds);

      // (p50) Cotizaciones. undefined = la edición no las tocó y se dejan como
      // están; si llegan, valen las mismas reglas que al crear (entre 1 y 3,
      // existentes y habilitadas). El formulario siempre las manda, así que un
      // material antiguo sin ninguna no se podrá guardar hasta asignarle una —
      // es el comportamiento acordado para que ningún material quede sin
      // respaldo de precio.
      const cotizaciones =
        quotationIds === undefined
          ? undefined
          : await quotationService.validarAsignacion(quotationIds);

      // Un material sin placa necesita cantidad, y al revés. Joi lo comprueba al
      // CREAR, pero al editar solo ve los campos que llegan: aquí se compara el
      // resultado final —lo que se manda mezclado con lo que ya estaba— porque
      // es el único punto donde se conoce el estado completo.
      const placaFinal    = data.senaPlate !== undefined ? data.senaPlate : actual.senaPlate;
      const cantidadFinal = data.quantity  !== undefined ? data.quantity  : actual.quantity;
      if (!placaFinal && (cantidadFinal === null || cantidadFinal === undefined)) {
        throw new Error('Un material sin placa SENA necesita una cantidad: escribe la cantidad o asígnale una placa.');
      }

      const imagenes = resolverOrden({
        actuales: actual.images ?? [],
        nuevos: nuevasImagenes,
        orden: ordenImagenes,
        aFila: aImagen,
        campoUrl: 'imageUrl',
        max: MAX_IMAGENES,
        min: MIN_IMAGENES,
        etiqueta: 'las imágenes',
      });

      const fichas = resolverOrden({
        actuales: actual.technicalSheets ?? [],
        nuevos: nuevasFichas,
        orden: ordenFichas,
        aFila: aFicha,
        campoUrl: 'fileUrl',
        max: MAX_FICHAS,
        min: MIN_FICHAS,
        etiqueta: 'las fichas técnicas',
      });

      // Archivos subidos que ningún orden menciona: quedarían en /uploads sin fila
      const huerfanos = [...imagenes.rutasHuerfanas, ...fichas.rutasHuerfanas];
      if (huerfanos.length) deleteFiles(huerfanos);

      const resultado = await consumableMaterialRepository.update(
        id, data, accountableIds, imagenes.ops, fichas.ops, cotizaciones,
      );

      // Los archivos del disco se borran DESPUÉS de que la transacción confirmó:
      // si fallara, las filas seguirían apuntando a archivos inexistentes
      const eliminados = [...imagenes.rutasEliminadas, ...fichas.rutasEliminadas];
      if (eliminados.length) deleteFiles(eliminados);

      return resultado;
    } catch (err) {
      // Solo se limpian los archivos RECIÉN subidos: los que ya estaban en BD
      // siguen siendo válidos porque la transacción no llegó a confirmarse
      if (nuevasRutas.length) deleteFiles(nuevasRutas);
      throw err;
    }
  },

  async toggle(id) {
    const record = await consumableMaterialService.getById(id);
    const updated = await consumableMaterialRepository.toggle(id, !record.isActive);
    return updated;
  },
};
