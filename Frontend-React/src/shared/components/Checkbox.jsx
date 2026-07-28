export default function Checkbox({
    id, // Identificador único (necesario para accesiblidad) 
    name, // Nombre del campo (útil para formulario) 
    label, // Texto visible asociado al checkbox 
    checked = false, // Estado controlado del checkbox
    onChange, // Funcion que maneja el cambio de estado
    disable = false, // Indica si el checkboix esta habilitado 
    className = "", // Clases adicionales para personalización

}) {


    return (
        <label
            htmlFor={id}
            className={`
                flex
                items-center
                gap-2
                text-sm
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

            <span className="font-secondary">{label}</span>

        </label>
    );

}