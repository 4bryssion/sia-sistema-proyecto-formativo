// ¿Se cumple una media query ahora mismo?
//
// Nace de la misma necesidad que useColumnCount: hay decisiones de layout que
// CSS no puede tomar porque no son de estilo sino de CUÁNTO se renderiza. El
// caso concreto es el número de previsualizaciones visibles en un FileInput:
// hasta sm se ve una y hay flechas para pasar entre ellas, en sm se ven todas.
// Ocultar las sobrantes con CSS no sirve: las flechas tendrían que saber
// cuántas quedan visibles para calcular el desplazamiento.
//
// useColumnCount responde "cuántas columnas caben" y tiene sus breakpoints
// fijos; esto es la pieza genérica de la que podría derivarse, pero se deja
// aparte para no cambiar un hook que ya usan dos formularios.

import { useCallback, useSyncExternalStore } from "react";

// Se resuelve con useSyncExternalStore y no con useState + useEffect: la media
// query es un estado que vive FUERA de React, y leerla en un efecto obligaba a
// un setState al montar (render en cascada, y el linter lo marca). Así React
// lee el valor en el propio render y se resuscribe solo si cambia la query.

/**
 * @param {string} query media query en el formato de CSS, ej. "(min-width: 40rem)"
 * @returns {boolean} si se cumple en el ancho actual
 */
export function useMediaQuery(query) {
    // Escuchar la media query y no el resize: solo dispara al cruzar el
    // breakpoint, no en cada píxel arrastrado
    const subscribe = useCallback((onStoreChange) => {
        const mql = window.matchMedia(query);
        mql.addEventListener("change", onStoreChange);
        return () => mql.removeEventListener("change", onStoreChange);
    }, [query]);

    const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

    // Sin ventana (render en servidor) se asume que no se cumple: el primer
    // render en el navegador ya devuelve el valor real
    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
