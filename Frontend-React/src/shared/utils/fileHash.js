// (p50) Huella SHA-256 de un archivo, calculada en el navegador.
//
// PARA QUÉ: poder avisar de que un PDF ya está cargado ANTES de subirlo. Sin
// esto habría que esperar a que suban hasta 60MB para enterarse de que no hacía
// falta subir nada.
//
// La huella que se GUARDA la calcula el backend sobre el archivo ya escrito en
// disco; esta solo sirve para preguntar. Que las dos coincidan no es casualidad:
// es el mismo SHA-256 sobre los mismos bytes.

/**
 * `crypto.subtle` solo existe en contextos seguros: https, o http en localhost.
 * Si se entra por la IP de la máquina desde otro equipo de la red, no está.
 *
 * En ese caso NO se rompe nada: se salta la comprobación previa y se carga
 * directamente. El backend sigue calculando y guardando la huella, así que la
 * detección sigue funcionando para las cargas siguientes.
 */
export const puedeCalcularHuella = () =>
  typeof globalThis.crypto?.subtle?.digest === "function";

const aHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/** @param {File} archivo @returns {Promise<string>} 64 caracteres hexadecimales */
export async function huellaDeArchivo(archivo) {
  const bytes = await archivo.arrayBuffer();
  return aHex(await globalThis.crypto.subtle.digest("SHA-256", bytes));
}

/**
 * Huellas de varios archivos, en el mismo orden.
 *
 * En serie y no en paralelo a propósito: en paralelo se cargan todos los
 * archivos en memoria a la vez, y seis de 10MB son 60MB de golpe en una pestaña
 * del navegador. En serie el coste en tiempo es el mismo y la memoria no sube.
 */
export async function huellasDeArchivos(archivos) {
  const huellas = [];
  for (const a of archivos) huellas.push(await huellaDeArchivo(a));
  return huellas;
}
