import path from 'path';
import { notify } from '../notifications/notification.service.js';
import fs from 'fs';
import { returnableMaterialRepository } from './returnableMaterial.repository.js';

const deleteFiles = (archivos) => {
  archivos.forEach((filePath) => {
    if (filePath) {
      const ruta = path.join('uploads', path.basename(filePath));
      fs.unlink(ruta, (err) => {
        if (err) console.error('Error eliminando archivo:', err);
      });
    }
  });
};

// Tope de fichas técnicas por material. Multer ya corta en 3 al subir, pero la
// edición puede combinar fichas conservadas + nuevas y ahí no interviene multer.
const MAX_FICHAS = 3;

// Fila de returnable_material_files a partir del archivo que entrega multer
const aFicha = (file, sortOrder) => ({
  fileUrl:   `/uploads/${file.filename}`,
  fileName:  file.originalname,
  mimeType:  file.mimetype,
  sortOrder,
});

// Orden final de las fichas tal como quedó en el formulario. Viaja como JSON
// dentro del multipart (un FormData no puede llevar un array sin serializarlo).
//
// Cada elemento es:
// - un número → id de una ficha ya guardada que se conserva
// - "new:<i>" → el archivo en la posición i de los subidos en technical_sheet
//
// Con solo la lista de ids conservados no bastaba: si el usuario arrastra un
// archivo nuevo al principio, al guardar habría saltado al final.
// Las fichas guardadas que NO aparezcan en la lista se eliminan.
const parseSheetOrder = (raw) => {
  if (raw === undefined || raw === '') return null;   // null = el form no tocó las fichas
  try {
    const orden = JSON.parse(raw);
    if (!Array.isArray(orden)) throw new Error();
    return orden;
  } catch {
    throw new Error('El orden de las fichas técnicas es inválido.');
  }
};

// Índice del archivo recién subido al que apunta un elemento "new:<i>"
const indiceDeNuevo = (item) => {
  if (typeof item !== 'string') return null;
  const match = /^new:(\d+)$/.exec(item);
  return match ? Number(match[1]) : null;
};

const parseCampos = (body) => ({
  ...body,
  userId:      body.userId      ? Number(body.userId)      : undefined,
  brandId:     body.brandId     ? Number(body.brandId)     : undefined,
  categoryId:  body.categoryId  ? Number(body.categoryId)  : undefined,
  unitPrice:   body.unitPrice   ? Number(body.unitPrice)   : undefined,
  totalPrice:  body.totalPrice  ? Number(body.totalPrice)  : undefined,
  purchaseDate: body.purchaseDate ? new Date(body.purchaseDate).toISOString() : undefined,
  quantity:    body.quantity !== undefined && body.quantity !== ''
                 ? Number(body.quantity)
                 : undefined,
  // Solo la categoría "Muebles y enseres" pide dimensiones; el resto manda el
  // campo vacío y debe quedar NULL, no como cadena vacía, para que la consulta
  // "materiales sin dimensiones" siga teniendo sentido
  dimensions:  body.dimensions === '' ? null : body.dimensions,
});

const separar = (data) => {
  // technicalSheet salió de aquí: las fichas ya no son una columna del material
  // sino filas de returnable_material_files (p46)
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
    const imagen = files?.image?.[0];
    const fichas = files?.technical_sheet ?? [];

    // Rutas de TODO lo subido: si la validación falla, ningún archivo debe
    // quedar huérfano en /uploads
    const subidos = [
      ...(imagen ? [`/uploads/${imagen.filename}`] : []),
      ...fichas.map((f) => `/uploads/${f.filename}`),
    ];

    if (!imagen) {
      deleteFiles(subidos);
      throw new Error('La imagen es requerida.');
    }
    if (!fichas.length) {
      deleteFiles(subidos);
      throw new Error('La ficha técnica es requerida.');
    }
    if (fichas.length > MAX_FICHAS) {
      deleteFiles(subidos);
      throw new Error(`Solo se permiten hasta ${MAX_FICHAS} fichas técnicas.`);
    }

    const data = parseCampos(bodyData);
    data.image = `/uploads/${imagen.filename}`;

    const { consumo, devolutivo } = separar(data);
    const sheets = fichas.map((f, i) => aFicha(f, i));

    try {
      const created = await returnableMaterialRepository.create(consumo, devolutivo, sheets);
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
    const currentMaterial = await returnableMaterialService.getById(id);

    const nuevasFichas = files?.technical_sheet ?? [];
    const nuevasRutas  = nuevasFichas.map((f) => `/uploads/${f.filename}`);

    const data = parseCampos(bodyData);
    if (files?.image?.[0]) data.image = `/uploads/${files.image[0].filename}`;

    // sheetOrder no es un campo del material: se saca antes de separar para que
    // no acabe en el update de Prisma
    const orden = parseSheetOrder(data.sheetOrder);
    delete data.sheetOrder;

    const { consumo, devolutivo } = separar(data);

    const actuales = currentMaterial.technicalSheets ?? [];

    // Sin sheetOrder (edición que no tocó los archivos) se conserva todo tal
    // cual y lo nuevo se agrega al final
    const ordenEfectivo = orden ?? [
      ...actuales.map((f) => f.id),
      ...nuevasFichas.map((_, i) => `new:${i}`),
    ];

    // Se recorre el orden pedido y se resuelve cada posición contra lo que
    // realmente existe: así una referencia inválida (id borrado en otra pestaña,
    // "new:5" sin archivo) se ignora en vez de romper la edición
    const conservadas = [];
    const creadas = [];
    ordenEfectivo.forEach((item) => {
      const nuevoIdx = indiceDeNuevo(item);
      if (nuevoIdx !== null) {
        const file = nuevasFichas[nuevoIdx];
        if (file) creadas.push({ file, sortOrder: conservadas.length + creadas.length });
        return;
      }
      const existente = actuales.find((f) => f.id === Number(item));
      if (existente) conservadas.push({ ...existente, sortOrder: conservadas.length + creadas.length });
    });

    // sortOrder correcto: se asigna por la posición final, no por el tipo
    const finales = [...conservadas, ...creadas]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item, i) => ({ ...item, sortOrder: i }));

    const eliminadas = actuales.filter((f) => !conservadas.some((c) => c.id === f.id));

    // Archivo subido que el orden no menciona: quedaría en /uploads sin fila que
    // lo apunte
    const huerfanos = nuevasFichas
      .filter((f) => !creadas.some((c) => c.file === f))
      .map((f) => `/uploads/${f.filename}`);
    if (huerfanos.length) deleteFiles(huerfanos);

    if (finales.length === 0) {
      deleteFiles(nuevasRutas);
      throw new Error('El material debe conservar al menos una ficha técnica.');
    }
    if (finales.length > MAX_FICHAS) {
      deleteFiles(nuevasRutas);
      throw new Error(`Solo se permiten hasta ${MAX_FICHAS} fichas técnicas.`);
    }

    const sheetOps = {
      deleteIds: eliminadas.map((f) => f.id),
      // Solo se tocan las filas cuya posición cambió de verdad
      reorder: finales
        .filter((item) => item.file === undefined)
        .map(({ id, sortOrder }) => ({ id, sortOrder }))
        .filter(({ id, sortOrder }) => actuales.find((f) => f.id === id)?.sortOrder !== sortOrder),
      create: finales
        .filter((item) => item.file !== undefined)
        .map(({ file, sortOrder }) => aFicha(file, sortOrder)),
    };

    try {
      const resultado = await returnableMaterialRepository.update(id, consumo, devolutivo, sheetOps);
      if (files?.image?.[0] && currentMaterial.consumableMaterial?.image)
        deleteFiles([currentMaterial.consumableMaterial.image]);
      // El archivo del disco se borra DESPUÉS de que la transacción confirmó:
      // si fallara, la fila seguiría apuntando a un archivo inexistente
      if (eliminadas.length) deleteFiles(eliminadas.map((f) => f.fileUrl));
      // Igual que en create: el repositorio devuelve el material de consumo
      const cmNew = resultado ?? {};
      const cambioCantidad =
        consumo.quantity !== undefined && Number(consumo.quantity) !== Number(currentMaterial?.consumableMaterial?.quantity)
          ? ` Cantidad: ${currentMaterial?.consumableMaterial?.quantity ?? 1} → ${cmNew.quantity ?? 1}.`
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
      if (files?.image?.[0]) deleteFiles([data.image]);
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
