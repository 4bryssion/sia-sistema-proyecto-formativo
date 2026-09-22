/**
 * (p50) Normalización de los nombres de catálogo.
 *
 * EL PROBLEMA QUE RESUELVE
 *
 * Los cuatro catálogos —marcas, inventarios, categorías y grupos— ya tenían
 * `@unique` en el nombre. Pero la unicidad de PostgreSQL compara el texto tal
 * cual, así que estas cinco convivían sin problema:
 *
 *     Gucci · GuccI · guCCi · Gúcci · "Gucci " (con espacio al final)
 *
 * Cinco marcas para una sola cosa, y cada material apuntando a la que le tocó.
 * El resultado no es solo desorden: los reportes por marca salen partidos y no
 * hay forma de saberlo mirando el listado.
 *
 * QUÉ HACE Y QUÉ NO
 *
 * - Recorta los espacios de los extremos y colapsa los de en medio: "Gucci  SA"
 *   y "Gucci SA" son la misma.
 * - Pasa a minúsculas: da igual cómo lo escriba cada quien.
 * - Quita las tildes de las vocales: "Gúcci" choca con "Gucci".
 *
 * - NO toca la eñe. En español la ñ es una letra distinta de la n, no una n con
 *   adorno: "Niño" y "Nino" son dos palabras, y fundirlas sería un error. Por
 *   eso se aparta antes de quitar acentos y se repone después — si no, la forma
 *   descompuesta de la ñ es una n con una tilde encima y se perdería con las
 *   demás.
 *
 * - NO cambia lo que se GUARDA ni lo que se MUESTRA. El nombre se guarda tal
 *   como lo escribió la persona, con sus mayúsculas y sus tildes; esto vive en
 *   una columna aparte y solo sirve para comparar.
 */

// Carácter que no aparece en ningún nombre real, usado para apartar la eñe
// mientras se quitan los acentos.
const RESGUARDO = '\u0000';

export const normalizarNombre = (texto) =>
  String(texto ?? '')
    .trim()
    // Varios espacios seguidos cuentan como uno
    .replace(/\s+/g, ' ')
    .toLowerCase()
    // La eñe se aparta ANTES de descomponer
    .replace(/ñ/g, RESGUARDO)
    // Descomponer y quitar los signos diacríticos (tildes, diéresis)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(new RegExp(RESGUARDO, 'g'), 'ñ');

/**
 * El nombre tal como se GUARDA: limpio de espacios sobrantes, pero respetando
 * las mayúsculas y las tildes que escribió la persona.
 */
export const limpiarNombre = (texto) => String(texto ?? '').trim().replace(/\s+/g, ' ');
