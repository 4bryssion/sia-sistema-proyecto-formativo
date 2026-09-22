import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

// (p50) Visor de imagen ampliada.
//
// Estaba escrito TRES veces, idéntico salvo el contenido: en el modal de ver
// usuario, en el de ver préstamo y en el panel de identidad de un material. Las
// tres copias repetían el portal, el velo, el z-index, el botón de cerrar y el
// `stopPropagation` de la imagen. Cambiar cualquier detalle obligaba a acordarse
// de los tres sitios.
//
// Por qué NO usa el `Modal` compartido: son cosas distintas. Un modal es una
// tarjeta blanca con título, cuerpo y pie; esto es un velo a pantalla completa
// cuyo único contenido es la imagen. Compartir el componente los obligaría a los
// dos a tener props que al otro no le sirven.
//
// La caja tiene tamaño definido y la imagen va al 100% dentro, en vez de solo
// `max-h/max-w`: con lo segundo, una imagen pequeña se quedaba en su tamaño
// original y la "ampliación" no ampliaba nada. Las medidas son el 70% de las
// iniciales (900px/85vh), porque a tamaño completo ocupaba casi toda la pantalla.
//
// Se cierra con un clic en cualquier parte del velo — de ahí el `cursor-zoom-out`
// — pero NO con Escape: estos visores se abren encima de un `Modal`, y como no
// participan de su pila de teclado, un Escape cerraría el modal de debajo y
// dejaría el visor colgando.
// OJO al usarlo: los HIJOS de un JSX se evalúan SIEMPRE, aunque este componente
// devuelva null. Si el contenido lee una propiedad de algo que puede ser null
// —la foto de un usuario que aún no ha llegado— hay que envolver el visor entero
// en esa condición, no confiar en `isOpen`:
//
//     {cargado && usuario?.foto && (
//       <ImageZoom isOpen={zoom} ...><img src={usuario.foto} /></ImageZoom>
//     )}
//
// Así los hijos ni siquiera se construyen mientras no hay nada que enseñar.
export default function ImageZoom({ isOpen, onClose, label, closeLabel = "Cerrar imagen", children }) {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-110 flex items-center justify-center bg-black/80 p-6 cursor-zoom-out"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={label}
        >
            <div className="absolute top-4 right-4">
                <IconButton ariaLabel={closeLabel} variant="onColor" onClick={onClose}>
                    <X strokeWidth={2.5} />
                </IconButton>
            </div>

            {/* stopPropagation: un clic en la propia imagen no debe cerrar el
                visor, solo el clic en el velo de alrededor. */}
            <div
                className="w-[min(63vw,630px)] h-[60vh] grid place-items-center"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
