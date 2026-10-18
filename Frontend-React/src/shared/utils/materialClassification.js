// (p53) Clasificación del material: tipo de material + categoría.
//
// Vive en `shared/` porque la usan los DOS módulos de material. Antes era
// `features/returnable-material/utils/categoryRules.js`, cuando la categoría
// existía solo en el devolutivo.
//
// Las dos listas salen de la MISMA tabla (`categories`) y las separa la columna
// `isMaterialType`:
//
// - Tipo de material: las 3 filas marcadas (Herramienta, Maquinaria y equipos,
//   Muebles y enseres). Son la clasificación gruesa del inventario del SENA y no
//   se crean desde el formulario de material.
// - Categoría: las que crea el usuario («Mesas», «Taladros»). Son las que el
//   botón de «crear y asignar» da de alta.
//
// Mezcladas en un solo select, elegir «Mesas» impedía decir que una mesa es un
// mueble, que es justo lo que el instructor pidió poder expresar.
//
// La marca viaja en la FILA y no se deduce del nombre, por lo mismo que
// `requiresDimensions` desde p50: renombrar la fila apagaría la regla en
// silencio.

/** Opciones del select, conservando las dos marcas de la fila. */
const aOpciones = (categorias) =>
    categorias.map((c) => ({
        value: String(c.id),
        label: c.categoryName,
        requiresDimensions: !!c.requiresDimensions,
    }));

/**
 * Parte el catálogo en los dos selects del formulario.
 * @param {Array<{id:number, categoryName:string, isMaterialType?:boolean, requiresDimensions?:boolean}>} categorias
 * @returns {{categoryOptions: Array, materialTypeOptions: Array}}
 */
export const separarClasificacion = (categorias = []) => ({
    categoryOptions:     aOpciones(categorias.filter((c) => !c.isMaterialType)),
    materialTypeOptions: aOpciones(categorias.filter((c) => c.isMaterialType)),
});

/**
 * ¿La opción seleccionada pide el campo de dimensiones?
 *
 * Se consulta sobre las opciones de TIPO de material: es ahí donde vive hoy la
 * regla («Muebles y enseres»). Para el resto la columna queda NULL y el campo no
 * se muestra.
 */
export const requiresDimensions = (options, id) =>
    !!options.find((o) => String(o.value) === String(id))?.requiresDimensions;

/** Nombre a partir del id seleccionado, para los textos de la pantalla. */
export const nombreDeOpcion = (options, id) =>
    options.find((o) => String(o.value) === String(id))?.label ?? "";
