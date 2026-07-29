// Número de columnas del formulario según el breakpoint activo.
//
// Por qué hace falta JavaScript para esto, habiendo CSS:
//
// - Con `grid` las FILAS SE COMPARTEN entre columnas: un campo alto (un TextArea)
//   estira su fila en todas las columnas y abre huecos muertos al lado.
// - Con `columns-*` (multi-columna) no hay filas, pero el navegador reparte
//   BALANCEANDO POR ALTURA, no por cantidad: con campos de alturas distintas las
//   columnas quedan con 5, 4 y 3 campos y se ven disparejas.
//
// La única forma de tener columnas independientes en altura Y con el mismo
// número de campos es construirlas nosotros, y para eso hay que saber cuántas
// caben. Se lee con matchMedia, que es la misma fuente de verdad que usa CSS.

import { useEffect, useState } from "react";

// Deben coincidir con los breakpoints de global.css (lg de Tailwind y el
// personalizado de 1400px)
const LG = "(min-width: 64rem)";
const XXL = "(min-width: 87.5rem)";

const read = () => {
    if (typeof window === "undefined") return 1;
    if (window.matchMedia(XXL).matches) return 3;
    if (window.matchMedia(LG).matches) return 2;
    return 1;
};

/**
 * @returns {1|2|3} columnas de campos disponibles en el ancho actual
 */
export function useColumnCount() {
    const [columns, setColumns] = useState(read);

    useEffect(() => {
        const queries = [window.matchMedia(LG), window.matchMedia(XXL)];
        const update = () => setColumns(read());
        // Se escucha el cambio de las media queries y no el resize de la ventana:
        // solo dispara al cruzar un breakpoint, no en cada píxel arrastrado
        queries.forEach((q) => q.addEventListener("change", update));
        return () => queries.forEach((q) => q.removeEventListener("change", update));
    }, []);

    return columns;
}
