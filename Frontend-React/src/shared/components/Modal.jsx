// Modal base del proyecto.
//
// Se extrajo al crear los modales de visualizar y editar usuario: hasta entonces
// cada modal (grupos, tareas, notificaciones, reportes) repetía a mano el overlay,
// el stopPropagation y el cierre con Escape, con pequeñas diferencias entre sí.
//
// Dos comportamientos de cierre, según el tipo de modal:
// - Consulta (visualizar): se cierra con clic fuera, con Escape y con la X.
// - Formulario (editar): NO se cierra con clic fuera — se perdería lo escrito.
//   Solo con Cancelar o con la X, que en ese caso va FUERA del modal, en una
//   esquina, para no restarle espacio al contenido.

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

const SIZES = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = "md",
    // false en formularios: evita perder lo escrito por un clic descuidado
    closeOnBackdrop = true,
    // true: la X se dibuja fuera de la tarjeta, en la esquina superior derecha
    closeButtonOutside = false,
    // false para ocultar la X (p. ej. si el pie ya trae Cancelar y Guardar)
    showCloseButton = true,
    className = "",
}) {
    // Escape cierra siempre: es la vía de escape estándar y no destruye datos
    // por accidente (requiere una acción deliberada del teclado)
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    // Bloquea el scroll del fondo mientras el modal está abierto
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [isOpen]);

    if (!isOpen) return null;

    // Portal a document.body: saca el modal de cualquier contenedor con
    // overflow o transform que lo recortaría o rompería su position:fixed
    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-start sm:items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6"
            onClick={closeOnBackdrop ? onClose : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
        >
            <div className={`relative w-full ${SIZES[size]} my-auto`}>

                {/* X por fuera de la tarjeta (modales de formulario) */}
                {showCloseButton && closeButtonOutside && (
                    <div className="absolute -top-2 -right-2 z-10 sm:-top-4 sm:-right-4">
                        <IconButton
                            ariaLabel="Cerrar"
                            onClick={onClose}
                            hitSize={40}
                            iconSize={22}
                            className="bg-white shadow-md hover:bg-neutral-200"
                        >
                            <X strokeWidth={2.5} />
                        </IconButton>
                    </div>
                )}

                <div
                    className={`rounded-2xl bg-white text-text-primary shadow-xl ${className}`}
                    // Sin esto, cualquier clic dentro del modal se propagaría al
                    // overlay y lo cerraría
                    onClick={(e) => e.stopPropagation()}
                >
                    {(title || (showCloseButton && !closeButtonOutside)) && (
                        <div className="flex items-start justify-between gap-4 px-6 pt-6">
                            {title && (
                                <h2 className="font-main text-h3 font-bold">{title}</h2>
                            )}
                            {showCloseButton && !closeButtonOutside && (
                                <IconButton ariaLabel="Cerrar" onClick={onClose} hitSize={36} iconSize={20}>
                                    <X strokeWidth={2.5} />
                                </IconButton>
                            )}
                        </div>
                    )}

                    <div className="px-6 py-5">{children}</div>

                    {footer && (
                        <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border px-6 py-4">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
