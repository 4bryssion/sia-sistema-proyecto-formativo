export default function Select({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    className = "",
}){


    return(
        <div
            className={`w-full md:max-w-[320px] ${className}`}
        >
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

            <select
                name={name}
                value={value}
                onChange={onChange}
                
                className={`
                    w-full
                    h-12
                    border 
                    border-border
                    rounded-md
                    px-4
                    font-secondary

                    hover:border-2
                    hover:border-focus-border
                    ${error ? "border-red-800" : "border border-border"}
                `}
            >
                <option
                    value=""
                >
                    Seleccione una opción
                </option>

                {
                    options.map((opt) => (
                        <option
                            key={opt.value ?? opt.id}
                            value={opt.value}
                        >
                            {opt.label}
                        </option>
                    ))
                }

            </select>

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
}