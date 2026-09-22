import { limpiarNombre, normalizarNombre } from './normalizeName.js';

/**
 * (p50) Prepara el nombre de un catálogo y comprueba que no choque con otro.
 *
 * Los cuatro catálogos —marcas, inventarios, categorías y grupos— hacen
 * exactamente lo mismo al crear y al editar, así que vive aquí y no copiado
 * cuatro veces.
 *
 * Por qué se comprueba en el service ADEMÁS de tener el UNIQUE en la base: la
 * restricción de la base es la que de verdad impide el duplicado, pero su error
 * es «el valor del campo brand_name_normalized ya está en uso», que no le dice
 * nada a nadie. Esto permite nombrar la que ya existe, con las mayúsculas y las
 * tildes con las que está guardada, para que se entienda por qué choca.
 *
 * @param {object}   p
 * @param {string}   p.valor          lo que escribió la persona
 * @param {Function} p.buscar         (normalizado) => registro | null
 * @param {number}   [p.idActual]     al editar, para no chocar consigo mismo
 * @param {Function} p.mensajeVacio   () => string
 * @param {Function} p.mensajeChoque  (registroExistente) => string
 * @returns {Promise<{limpio: string, normalizado: string}>}
 */
export async function prepararNombre({ valor, buscar, idActual = null, mensajeVacio, mensajeChoque }) {
  const limpio = limpiarNombre(valor);
  if (!limpio) throw new Error(mensajeVacio());

  const normalizado = normalizarNombre(limpio);
  const existente = await buscar(normalizado);

  // Al editar, chocar consigo mismo no es chocar: es no haber cambiado el
  // nombre, o haberle cambiado solo una tilde.
  if (existente && existente.id !== idActual) throw new Error(mensajeChoque(existente));

  return { limpio, normalizado };
}
