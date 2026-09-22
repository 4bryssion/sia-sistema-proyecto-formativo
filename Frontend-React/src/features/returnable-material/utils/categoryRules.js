// Reglas de categoría del material devolutivo. Viven aquí y no en shared porque
// las categorías solo intervienen en este módulo.
//
// (p50) ANTES: se comparaba el NOMBRE de la categoría contra el texto literal
// "muebles y enseres", normalizado sin tildes ni mayúsculas. Funcionaba mientras
// las categorías eran intocables, pero al abrirles un módulo propio —con
// creación, edición y desactivación— renombrar esa fila habría apagado la regla
// en silencio: los materiales se guardarían sin la medida y nada avisaría.
//
// AHORA: la exigencia viaja en la propia categoría (`requiresDimensions`, una
// columna de la tabla). Renombrarla no rompe nada, y una categoría nueva puede
// pedir dimensiones si se marca al crearla.

/**
 * ¿La categoría seleccionada pide el campo de dimensiones?
 * Para el resto la columna queda NULL y no interviene en la creación.
 *
 * @param {Array<{value: string, label: string, requiresDimensions?: boolean}>} options
 * @param {string} categoryId  id seleccionado en el select
 */
export const requiresDimensions = (options, categoryId) =>
  !!options.find((o) => String(o.value) === String(categoryId))?.requiresDimensions;

/** Nombre de categoría a partir del id seleccionado en el select */
export const categoryNameOf = (options, categoryId) =>
  options.find((o) => String(o.value) === String(categoryId))?.label ?? "";

/**
 * Las opciones del select conservan la marca de la categoría, no solo su
 * nombre: es lo que permite decidir si pedir dimensiones sin volver a consultar.
 */
export const toCategoryOptions = (categorias) =>
  categorias.map((c) => ({
    value: String(c.id),
    label: c.categoryName,
    requiresDimensions: !!c.requiresDimensions,
  }));
