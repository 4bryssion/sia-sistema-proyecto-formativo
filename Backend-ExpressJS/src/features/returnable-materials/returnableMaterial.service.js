import { notify } from '../notifications/notification.service.js';
import { returnableMaterialRepository } from './returnableMaterial.repository.js';
import { deleteFiles, parseOrden, resolverOrden } from '../../shared/orderedFiles.js';

// Topes por material. Multer ya corta al subir, pero la edición puede combinar
// archivos conservados + nuevos y ahí no interviene multer.
const MAX_IMAGENES = 3;
const MAX_FICHAS = 3;
// En el devolutivo la ficha técnica SÍ es obligatoria (a diferencia del material
// de consumo): es documentación del equipo y todos los ya registrados la tienen.
const MIN_FICHAS = 1;
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

const parseCampos = (body) => ({
  ...body,
  // (p48) La marca es opcional, así que hay que poder QUITÁRSELA a un material
  // que ya la tenía: el campo vacío significa "no tiene" y viaja como null.
  // Con `undefined` (que es lo que hay que mandar para "no lo toqué") Prisma
  // ignora la columna y la marca vieja se quedaba pegada para siempre.
  brandId:      body.brandId === '' ? null : (body.brandId ? Number(body.brandId) : undefined),
  inventoryId:  body.inventoryId ? Number(body.inventoryId) : undefined,
  categoryId:   body.categoryId  ? Number(body.categoryId)  : undefined,
  unitPrice:    body.unitPrice   ? Number(body.unitPrice)   : undefined,
  totalPrice:   body.totalPrice  ? Number(body.totalPrice)  : undefined,
  purchaseDate: body.purchaseDate ? new Date(body.purchaseDate).toISOString() : undefined,
  entryDate:    body.entryDate    ? new Date(body.entryDate).toISOString()    : undefined,
  // (p48) Vacío = "no tiene cantidad", o sea material serializado. Es lo que
  // permite convertir uno por cantidad en uno con placa SENA y al revés. Antes
  // el vacío daba `undefined` ("no lo toqué"), así que la cantidad vieja se
  // quedaba pegada y el material acababa con placa Y cantidad a la vez.
  quantity:     body.quantity === ''
                  ? null
                  : (body.quantity !== undefined ? Number(body.quantity) : undefined),
  // Mismo criterio para la placa: vacía significa "quítasela"
  senaPlate:    body.senaPlate === '' ? null : body.senaPlate,
  // Solo la categoría "Muebles y enseres" pide dimensiones; el resto manda el
  // campo vacío y debe quedar NULL, no como cadena vacía, para que la consulta
  // "materiales sin dimensiones" siga teniendo sentido.
  // (p48) model y serial siguen el mismo criterio: ahora son opcionales y un
  // campo vacío significa "no tiene", no "cadena vacía". Además serial es único,
  // y dos cadenas vacías chocarían entre sí mientras que dos NULL no.
  dimensions:   body.dimensions === '' ? null : body.dimensions,
  model:        body.model === '' ? null : body.model,
  serial:       body.serial === '' ? null : body.serial,
});

const separar = (data) => {
  // technicalSheets salió de aquí en p46 (dejaron de ser una columna) y en p48
  // pasaron a colgar del padre junto con las imágenes y los cuentadantes
  const camposDevolutivo = ['categoryId', 'model', 'serial', 'dimensions'];
  const devolutivo = {};
  const consumo = {};

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (camposDevolutivo.includes(key)) devolutivo[key] = val;
      else consumo[key] = val;
    }
  }

  return { consumo, devolutivo };
};

const validarCuentadantes = async (ids) => {
  if (!ids.length) throw new Error('Debe asignar al menos un cuentadante.');
  const validos = await returnableMaterialRepository.findValidAccountables(ids);
  if (validos.length !== ids.length) {
    throw new Error('Alguno de los cuentadantes seleccionados no existe, está inactivo o no es cuentadante.');
  }
};

export const returnableMaterialService = {
  async getAll(status = 'active') {
    return returnableMaterialRepository.findAll(status);
  },

  async getById(id) {
    const material = await returnableMaterialRepository.findById(id);
    if (!material) throw new Error('Material devolutivo no encontrado.');
    return material;
  },

  async create(bodyData, files) {
    const imagenes = files?.image ?? [];
    const fichas   = files?.technical_sheet ?? [];

    // Rutas de TODO lo subido: si la validación falla, ningún archivo debe
    // quedar huérfano en /uploads
    const subidos = [...imagenes, ...fichas].map((f) => `/uploads/${f.filename}`);
    const abortar = (mensaje) => { deleteFiles(subidos); throw new Error(mensaje); };

    if (imagenes.length < MIN_IMAGENES) abortar('La imagen es requerida.');
    if (imagenes.length > MAX_IMAGENES) abortar(`Solo se permiten hasta ${MAX_IMAGENES} imágenes.`);
    if (fichas.length < MIN_FICHAS)     abortar('La ficha técnica es requerida.');
    if (fichas.length > MAX_FICHAS)     abortar(`Solo se permiten hasta ${MAX_FICHAS} fichas técnicas.`);

    const data = parseCampos(bodyData);
    const accountableIds = parseAccountables(data.accountableIds);
    delete data.accountableIds;
    // En create el orden es el de subida: si llegaran, se descartan
    delete data.imageOrder;
    delete data.sheetOrder;

    if (accountableIds === undefined) abortar('Debe asignar al menos un cuentadante.');
    try {
      await validarCuentadantes(accountableIds);
    } catch (err) {
      abortar(err.message);
    }

    const { consumo, devolutivo } = separar(data);

    try {
      const created = await returnableMaterialRepository.create(
        consumo,
        devolutivo,
        accountableIds,
        imagenes.map((f, i) => aImagen(f, i)),
        fichas.map((f, i) => aFicha(f, i)),
      );
      // El repositorio crea desde la tabla PADRE: lo que vuelve ya es el
      // material de consumo (con `returnable` dentro), no un envoltorio.
      // Leerlo como `created.consumableMaterial` dejaba la notificación con el
      // nombre vacío y la cantidad en 1.
      const cm = created ?? {};
      notify({
        title: 'Material devolutivo creado',
        description: `Se creó "${cm.materialName ?? ''}" con cantidad ${cm.quantity ?? 1}${cm.senaPlate ? ` (placa ${cm.senaPlate})` : ''}.`,
        module: 'returnable-materials',
      });
      return created;
    } catch (err) {
      deleteFiles(subidos);
      throw err;
    }
  },

  async update(id, bodyData, files) {
    const actual = await returnableMaterialService.getById(id);
    // (p48) imágenes, fichas y cuentadantes cuelgan del padre
    const padre = actual.consumableMaterial ?? {};

    const nuevasImagenes = files?.image ?? [];
    const nuevasFichas   = files?.technical_sheet ?? [];
    const nuevasRutas    = [...nuevasImagenes, ...nuevasFichas].map((f) => `/uploads/${f.filename}`);

    const data = parseCampos(bodyData);

    // Estos tres no son columnas del material: se sacan antes de separar para
    // que no acaben en el update de Prisma
    const ordenImagenes  = parseOrden(data.imageOrder, 'las imágenes');
    const ordenFichas    = parseOrden(data.sheetOrder, 'las fichas técnicas');
    const accountableIds = parseAccountables(data.accountableIds);
    delete data.imageOrder;
    delete data.sheetOrder;
    delete data.accountableIds;

    const { consumo, devolutivo } = separar(data);

    try {
      if (accountableIds !== undefined) await validarCuentadantes(accountableIds);

      // Un material sin placa necesita cantidad, y al revés. Joi lo comprueba al
      // CREAR, pero al editar solo ve los campos que llegan: aquí se compara el
      // resultado final —lo que se manda mezclado con lo que ya estaba— porque
      // es el único punto donde se conoce el estado completo.
      const placaFinal    = consumo.senaPlate !== undefined ? consumo.senaPlate : padre.senaPlate;
      const cantidadFinal = consumo.quantity  !== undefined ? consumo.quantity  : padre.quantity;
      if (!placaFinal && (cantidadFinal === null || cantidadFinal === undefined)) {
        throw new Error('Un material sin placa SENA necesita una cantidad: escribe la cantidad o asígnale una placa.');
      }

      const imagenes = resolverOrden({
        actuales: padre.images ?? [],
        nuevos: nuevasImagenes,
        orden: ordenImagenes,
        aFila: aImagen,
        campoUrl: 'imageUrl',
        max: MAX_IMAGENES,
        min: MIN_IMAGENES,
        etiqueta: 'las imágenes',
      });

      const fichas = resolverOrden({
        actuales: padre.technicalSheets ?? [],
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

      const resultado = await returnableMaterialRepository.update(
        id, consumo, devolutivo, accountableIds, imagenes.ops, fichas.ops,
      );

      // Los archivos del disco se borran DESPUÉS de que la transacción confirmó:
      // si fallara, las filas seguirían apuntando a archivos inexistentes
      const eliminados = [...imagenes.rutasEliminadas, ...fichas.rutasEliminadas];
      if (eliminados.length) deleteFiles(eliminados);

      // Igual que en create: el repositorio devuelve el material de consumo
      const cmNew = resultado ?? {};
      const cambioCantidad =
        consumo.quantity !== undefined && Number(consumo.quantity) !== Number(padre.quantity)
          ? ` Cantidad: ${padre.quantity ?? 1} → ${cmNew.quantity ?? 1}.`
          : '';
      notify({
        title: cambioCantidad ? 'Cantidad de material modificada' : 'Material devolutivo modificado',
        description: `Se actualizó "${cmNew.materialName ?? ''}".${cambioCantidad}`,
        module: 'returnable-materials',
      });
      return resultado;
    } catch (err) {
      // Solo se limpian los archivos RECIÉN subidos: los que ya estaban en BD
      // siguen siendo válidos porque la transacción no llegó a confirmarse
      if (nuevasRutas.length) deleteFiles(nuevasRutas);
      throw err;
    }
  },

  async toggle(id) {
    const record = await returnableMaterialService.getById(id);
    const currentIsActive = record.consumableMaterial.isActive;
    const updated = await returnableMaterialRepository.toggle(id, !currentIsActive);
    notify({
      title: !currentIsActive ? 'Material devolutivo activado' : 'Material devolutivo desactivado',
      description: `El material devolutivo #${id} quedó ${!currentIsActive ? 'activo' : 'inactivo'}.`,
      severity: !currentIsActive ? 'Informativa' : 'Advertencia',
      module: 'returnable-materials',
    });
    return updated;
  },
};
