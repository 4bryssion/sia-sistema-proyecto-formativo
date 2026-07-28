export default function Input({
    label,
    type = "text",
    error,
    className = "",
    // required: pinta el asterisco de campo obligatorio junto al label
    required = false,
    // Prefijo visual fijo (ej. "$" para precios): se superpone dentro del campo y
    // desplaza el texto; NO forma parte del value (el dato sigue siendo numérico puro)
    prefix,
    ...props
}){
    // Cuerpo de la función
    return(
        // Contenedor del input que se exporta con label, cuerpo y feedback meesage
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

            {/* Contenedor del input */}
            <div
                className="
                    relative
                    h-11
                    flex
                    items-center
                ">

                {/* Área interactiva invisible de un input 48px */}
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

                {/* Área visual del input */}
                <input
                    type={type}
                    className={`
                        relative
                        w-full
                        h-12
                        rounded-md
                        border
                        border-border
                        ${prefix ? "pl-8 pr-4" : "px-4"}
                        text-base
                        font-secondary
                        
                        hover:border-2
                        hover:border-focus-border

                        focus:outline-none
                        focus:ring-1
                        focus:ring-focus-ring

                        ${error ? "border-red-800" : "border border-border"}
                    `}
                        {...props}
                />

                {/* Prefijo visual (no editable ni eliminable; fuera del value).
                    Va DESPUÉS del input para no romper el nextSibling.focus() del
                    overlay; al ser absoluto, el orden no afecta lo visual */}
                {prefix && (
                    <span
                        className="
                            absolute
                            left-4
                            z-10
                            text-base
                            font-secondary
                            text-text-primary
                            pointer-events-none
                            select-none
                        "
                    >
                        {prefix}
                    </span>
                )}

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