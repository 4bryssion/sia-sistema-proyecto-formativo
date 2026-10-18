/**
 * (p51) Marco pulsable que abre el visor de imagen (`ImageZoom`).
 *
 * Existe porque este mismo marcado estaba copiado TRES veces —la foto del
 * usuario en su ficha, la del receptor en la ficha del préstamo y la imagen del
 * material— con la misma cadena de clases letra por letra. Tres copias de una
 * clase son tres sitios donde arreglar el día que el borde o el cursor cambien,
 * y dos de ellos se olvidan.
 *
 * Lo que varía queda como props: qué se abre, con qué etiqueta y si hay algo que
 * ampliar. Sin imagen el botón se deshabilita en vez de abrir un recuadro vacío.
 *
 * El <button> crudo es correcto AQUÍ: este archivo es el componente compartido
 * que lo envuelve. `Button` no sirve —trae su propio relleno y sus variantes— y
 * `IconButton` es redondo y de tamaño fijo; esto es un marco alrededor de una
 * imagen de cualquier tamaño.
 */
export default function ZoomTrigger({
    onZoom,
    disabled = false,
    ariaLabel = "Ampliar imagen",
    children,
}) {
    return (
        <button
            type="button"
            onClick={onZoom}
            aria-label={ariaLabel}
            disabled={disabled}
            className="rounded-xl overflow-hidden border border-border cursor-zoom-in hover:opacity-90 transition-opacity disabled:cursor-default"
        >
            {children}
        </button>
    );
}
