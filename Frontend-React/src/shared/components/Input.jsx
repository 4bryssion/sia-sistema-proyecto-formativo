export default function Input({
    label,
    type = "text",
    error,
    className = "",
    ...props
}){
    // Cuerpo de la función
    return(
        // Contenedor del input que se exporta con label, cuerpo y feedback meesage
        <div className={`w-[320px] ${className}`}>

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
                </label>
            )}

            {/* ============================== */}

            {/* Contenedor del input */}
            <div
                className="
                    relative
                    h-12
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
                        px-4
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