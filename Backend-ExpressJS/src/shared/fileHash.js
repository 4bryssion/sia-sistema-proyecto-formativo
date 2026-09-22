import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

/**
 * (p50) Huella SHA-256 del contenido de un archivo.
 *
 * Es lo que permite decir "este PDF ya está cargado" aunque venga con otro
 * nombre, y no molestar cuando dos documentos distintos se llaman los dos
 * `cotizacion.pdf`.
 *
 * Se lee por partes y no de golpe: un archivo de 10MB entero en memoria por cada
 * uno de los 6 de una carga son 60MB de golpe sin necesidad. El coste medido en
 * el equipo de desarrollo es de unos 10 ms por archivo de 10MB, sobre una carga
 * que ya movió ese archivo por la red.
 *
 * SIEMPRE se calcula aquí, nunca se acepta el que mande el navegador: el
 * frontend calcula el suyo para poder avisar ANTES de subir nada, pero el que se
 * guarda es este.
 *
 * @param {string} ruta ruta absoluta del archivo ya escrito en disco
 * @returns {Promise<string>} 64 caracteres hexadecimales
 */
export const hashDeArchivo = (ruta) =>
  new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const lector = createReadStream(ruta);
    lector.on('error', reject);
    lector.on('data', (parte) => hash.update(parte));
    lector.on('end', () => resolve(hash.digest('hex')));
  });

/** Formato de una huella válida: 64 caracteres hexadecimales en minúscula. */
export const esHashValido = (valor) => /^[0-9a-f]{64}$/.test(String(valor ?? ''));
