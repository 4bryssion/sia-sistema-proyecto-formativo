// Resolución del orden final de una colección de archivos de un material.
//
// El mismo problema aparece cuatro veces (imágenes y fichas técnicas, en
// consumibles y en devolutivos), así que vive aquí en vez de repetirse: es el
// único algoritmo del backend que no es una consulta ni una validación simple,
// y duplicarlo significaría corregir cada bug cuatro veces.
//
// Salió de returnableMaterial.service.js (p46), donde resolvía solo las fichas.
// Lo único que se parametrizó es de qué colección se habla; la lógica es idéntica.

import path from 'path';
import fs from 'fs';

/** Borra del disco las rutas indicadas. Los fallos se registran, no se propagan. */
export const deleteFiles = (rutas) => {
  rutas.forEach((filePath) => {
    if (!filePath) return;
    fs.unlink(path.join('uploads', path.basename(filePath)), (err) => {
      if (err) console.error('Error eliminando archivo:', err);
    });
  });
};

// Orden pedido por el formulario. Viaja como JSON dentro del multipart porque un
// FormData no puede llevar un array sin serializarlo.
//
// Cada elemento es:
// - un número → id de una fila ya guardada que se conserva
// - "new:<i>" → el archivo en la posición i de los recién subidos
//
// Con solo la lista de ids conservados no bastaba: si el usuario arrastra un
// archivo nuevo al principio, al guardar habría saltado al final.
export const parseOrden = (raw, etiqueta) => {
  if (raw === undefined || raw === '') return null; // null = el formulario no tocó esta colección
  try {
    const orden = JSON.parse(raw);
    if (!Array.isArray(orden)) throw new Error();
    return orden;
  } catch {
    throw new Error(`El orden de ${etiqueta} es inválido.`);
  }
};

const indiceDeNuevo = (item) => {
  if (typeof item !== 'string') return null;
  const match = /^new:(\d+)$/.exec(item);
  return match ? Number(match[1]) : null;
};

/**
 * Decide qué filas se borran, cuáles cambian de posición y cuáles se crean.
 *
 * @param {object}   p
 * @param {Array}    p.actuales   filas ya guardadas ({ id, sortOrder, ... })
 * @param {Array}    p.nuevos     archivos recién subidos (objetos de multer)
 * @param {Array?}   p.orden      resultado de parseOrden; null = conservar todo y agregar al final
 * @param {Function} p.aFila      (file, sortOrder) => fila lista para insertar
 * @param {string}   p.campoUrl   nombre de la columna con la ruta ('fileUrl' | 'imageUrl')
 * @param {number}   p.max        tope de archivos
 * @param {number}   p.min        mínimo exigido (0 = la colección puede quedar vacía)
 * @param {string}   p.etiqueta   cómo se nombra la colección en los mensajes de error
 * @returns {{ ops, rutasEliminadas, rutasHuerfanas }}
 */
export const resolverOrden = ({ actuales, nuevos, orden, aFila, campoUrl, max, min, etiqueta }) => {
  // Sin orden explícito (edición que no tocó los archivos) se conserva todo tal
  // cual y lo nuevo se agrega al final
  const ordenEfectivo = orden ?? [
    ...actuales.map((f) => f.id),
    ...nuevos.map((_, i) => `new:${i}`),
  ];

  // Se recorre el orden pedido y se resuelve cada posición contra lo que
  // realmente existe: así una referencia inválida (id borrado en otra pestaña,
  // "new:5" sin archivo) se ignora en vez de romper la edición
  const conservadas = [];
  const creadas = [];
  ordenEfectivo.forEach((item) => {
    const nuevoIdx = indiceDeNuevo(item);
    if (nuevoIdx !== null) {
      const file = nuevos[nuevoIdx];
      if (file) creadas.push({ file, sortOrder: conservadas.length + creadas.length });
      return;
    }
    const existente = actuales.find((f) => f.id === Number(item));
    if (existente) conservadas.push({ ...existente, sortOrder: conservadas.length + creadas.length });
  });

  // sortOrder correcto: se asigna por la posición final, no por el tipo de fila
  const finales = [...conservadas, ...creadas]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, i) => ({ ...item, sortOrder: i }));

  // Archivo subido que el orden no menciona: quedaría en /uploads sin fila que lo apunte
  const rutasHuerfanas = nuevos
    .filter((f) => !creadas.some((c) => c.file === f))
    .map((f) => `/uploads/${f.filename}`);

  if (finales.length < min) {
    throw new Error(
      min === 1
        ? `El material debe conservar al menos ${etiqueta === 'las imágenes' ? 'una imagen' : 'una ficha técnica'}.`
        : `El material debe conservar al menos ${min} de ${etiqueta}.`,
    );
  }
  if (finales.length > max) {
    throw new Error(`Solo se permiten hasta ${max} de ${etiqueta}.`);
  }

  const eliminadas = actuales.filter((f) => !conservadas.some((c) => c.id === f.id));

  return {
    ops: {
      deleteIds: eliminadas.map((f) => f.id),
      // Solo se tocan las filas cuya posición cambió de verdad
      reorder: finales
        .filter((item) => item.file === undefined)
        .map(({ id, sortOrder }) => ({ id, sortOrder }))
        .filter(({ id, sortOrder }) => actuales.find((f) => f.id === id)?.sortOrder !== sortOrder),
      create: finales
        .filter((item) => item.file !== undefined)
        .map(({ file, sortOrder }) => aFila(file, sortOrder)),
    },
    rutasEliminadas: eliminadas.map((f) => f[campoUrl]),
    rutasHuerfanas,
  };
};
