export default function Checkbox({
    id, // Identificador único (necesario para accesiblidad) 
    name, // Nombre del campo (útil para formulario) 
    label, // Texto visible asociado al checkbox 
    checked = false, // Estado controlado del checkbox
    onChange, // Funcion que maneja el cambio de estado
    disable = false, // Indica si el checkboix esta habilitado
    className = "", // Clases adicionales para personalización
    // Tamaño del texto del label. Va sobre el <span> y no sobre el <label> para
    // que el consumidor pueda sobrescribirlo: dos utilidades de tamaño en el
    // mismo elemento se resolverían por el orden del CSS, no por el del atributo.
    labelClassName = "text-sm",

}) {


    return (
        <label
            htmlFor={id}
            className={`
                flex
                items-center
                gap-2
                cursor-pointer
                ${disable ? "opacity-50 cursor-not-allowed" : ""}
                ${className }
            `}
        >
            {/* Input del checkbox */}

            <input 
                id={id}
                name={name}
                type="checkbox"  
                checked={checked}
                disabled={disable}
                onChange={onChange}
                className="
                    w-5 h-5
                "
            />
            {/* Texto del checkbox */}

            <span className={`font-secondary ${labelClassName}`}>{label}</span>

        </label>
    );

}