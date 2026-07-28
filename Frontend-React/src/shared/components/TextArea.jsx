/**
 * TextArea — campo de texto multilínea.
 *
 * Nota: por decisión del proyecto se sale un poco de Material Design:
 * - Ancho: igual al de un input normal (320px).
 * - Altura: fija de 130px (no colapsa ni hace auto-grow).
 *
 * Escalable igual que Input: label, error, className y resto de props nativas
 * (value, onChange, name, placeholder, disabled, readOnly, maxLength, etc.) vía spread.
 */
export default function TextArea({
    label,
    error,
    className = "",
    // required: pinta el asterisco de campo obligatorio junto al label
    required = false,
    ...props
}){
    // Cuerpo de la función
    return(
        // Contenedor del textarea que se exporta con label, cuerpo y feedback message
        <div className={`w-full md:max-w-[320px] ${className}`}>

            {/* Label */}
            {label && (
                <label
                    className={`
                        block
                        text-caption
                        mb-1
                        place-self-start
                        font-secondary

                        ${error ? "text-red-800" : "text-text-primary"}
                    `}
                >
                    {label}
                    {required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
                </label>
            )}

            {/* ============================== */}

            {/* Contenedor del textarea */}
            <div className="relative flex items-start">

                {/* Área interactiva invisible (mismo patrón que Input) */}
                <div
                    className="
                        absolute
                        inset-0
                    "
                    onMouseDown={(e) => {
                        e.preventDefault();
                        /* Mueve el foco al siguiente elemento hermano del elemento actual. 'currentTarget' referencia el elemento que tiene el handler del evento. */
                        e.currentTarget.nextSibling.focus();
                    }}
                />

                {/* Área visual del textarea: altura fija 152px, sin resize manual */}
                <textarea
                    className={`
                        relative
                        w-full
                        h-32.5
                        rounded-md
                        border
                        border-border
                        px-4
                        py-3
                        text-base
                        font-secondary
                        resize-none
                        overflow-y-auto

                        hover:border-2
                        hover:border-focus-border

                        focus:outline-none
                        focus:ring-1
                        focus:ring-focus-ring

                        ${error ? "border-red-800" : "border border-border"}
                    `}
                        {...props}
                />

            </div>

            {/* Feedback message */}
            {
                error && <p
                    className="
                        text-caption
                        text-error
                        place-self-start
                        font-secondary
                    "
                >
                {error}
                </p>
            }

        </div>
    )
};
