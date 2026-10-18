import { Check, X } from "lucide-react";

/**
 * Switch de estado (activo / inactivo).
 *
 * (p51) CONTROLADO POR EL PADRE, sin estado propio. Antes guardaba el suyo y lo
 * invertía en el clic, antes de que el padre decidiera nada. Como casi todos los
 * usos abren una confirmación —"¿seguro que quieres desactivar esto?"—, al
 * cancelar el switch ya se había movido: el dato seguía activo y el switch decía
 * inactivo. Y no se recuperaba, porque el efecto que lo sincronizaba dependía de
 * `checked`, que no había cambiado; para el padre no pasó nada. El siguiente
 * clic pedía entonces lo contrario de lo que mostraba.
 *
 * Afectaba a los diez módulos que lo usan. Ahora lo que se ve es siempre el
 * dato: el switch avisa del clic y se mueve cuando el padre cambia `checked`,
 * que es después de que el servidor confirme. Si la operación se cancela o
 * falla, no se mueve, que es justo lo correcto.
 */
export default function StatusSwitch({
    checked = false,
    onChange,
    disabled = false,
    size = "md",
    className = "",
}) {
    const handleToggle = () => {
        if (disabled) return;
        // Se propone el valor contrario; quien manda sobre el estado es el padre.
        onChange?.(!checked);
    };

    const sizes = {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14",
    };

    // El círculo que se desplaza
    const knobSizes = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={checked ? "Desactivar" : "Activar"}
            onClick={handleToggle}
            disabled={disabled}
            // Los comentarios ya no van dentro de la cadena de clases: ahí dentro
            // no son comentarios, son nombres de clase que Tailwind no conoce y
            // que acababan en el atributo `class` del elemento.
            className={`
                relative items-center rounded-full transition-colors
                ${sizes[size]}
                ${checked ? "bg-green-500" : "bg-gray-300"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${className}
            `}
        >
            <span
                className={`
                    absolute left-0.5 flex items-center justify-center
                    rounded-full bg-white shadow transition-transform
                    ${knobSizes[size]}
                    ${checked ? "translate-x-full" : "translate-x-0"}
                `}
            >
                {checked ? (
                    <Check size={12} className="text-green-600" />
                ) : (
                    <X size={12} className="text-gray-500" />
                )}
            </span>
        </button>
    );
}
