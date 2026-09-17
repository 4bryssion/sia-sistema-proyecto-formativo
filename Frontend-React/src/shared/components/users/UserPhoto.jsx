import { CircleUser } from "lucide-react";
import { API_FILES } from "@/shared/utils/materialFiles";

// Foto de un usuario, con icono de reemplazo.
//
// (p48) La foto pasó a ser OPCIONAL al crear el usuario, así que ya no se puede
// dar por hecho que existe. Antes cada pantalla hacía
// `src={`${API_FILES}${user.userPhoto ?? ""}`}`, que con la foto ausente pide
// la raíz del servidor y pinta el icono de imagen rota del navegador.
//
// Vive en shared porque lo usan el modal de consulta, el de edición y la vista
// de préstamo.
export default function UserPhoto({
    photo,
    alt = "",
    // Clases de tamaño y forma; las aporta quien lo usa porque cada pantalla
    // tiene la suya (128px en los modales, 48px en la fila de un préstamo)
    className = "w-32 h-32",
    rounded = "rounded-xl",
}) {
    if (!photo) {
        return (
            <div
                className={`${className} ${rounded} grid place-items-center bg-(--color-cuaternario-200) text-text-muted`}
                role="img"
                aria-label={alt ? `${alt} (sin foto)` : "Usuario sin foto"}
            >
                {/* El icono ocupa la mitad de la caja: se calcula con CSS, no con
                    una prop de tamaño, para que sirva a cualquier medida */}
                <CircleUser className="w-1/2 h-1/2" strokeWidth={1.6} aria-hidden="true" />
            </div>
        );
    }

    return (
        <img
            src={`${API_FILES}${photo}`}
            alt={alt}
            className={`${className} ${rounded} object-contain`}
        />
    );
}
