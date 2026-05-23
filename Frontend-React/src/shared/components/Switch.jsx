// Hooks de react para manejar estado y efectos
import { useState, useEffect } from "react";

// Iconos usados dentro del switch
import { Check, X } from "lucide-react";

// Componente reutlizable para representar un switch de estado (activo/inactivo)
export default function StatusSwitch({
    checked = false, // Valor inicial del switch (controlado desde el padre)
    onChange, // Callback que se ejecuta cuando cambia el estado
    disabled = false, // Permite deshabilitar la interacción
    size = "md", // Tamaño del switch (sm, md, lg)
    className = "",
}){

    // Estado interno del componente
    // Se inicializa con el valor recibido desde la prop "checked"
    const [ isActive, setIsActive ] = useState(checked)

    // Efecto que sincroniza el estado interno con el valor recibido desde el componente padre
    useEffect(() => {
        setIsActive(checked);
    }, [checked]); // Se ejecuta cada vez que cambia "checked"

    // Función que maneja el cambio del switch
    const handleToggle = () => {

        // Si el switch está deshabilitado no permite interacción
        if(disabled) return;

        // Calcula el nuevo estado (Invierte el valor actual)
        const newValue = !isActive;

        // Actualiza el estado interno
        setIsActive(newValue);

        // Si existe un callback onChange, se ejecuta enviando el nuevo valor al componente padre
        if (onChange){
            onChange(newValue);
        }
    };

    // Clases de tamaño del contenedor del switch
    const sizes = {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14",
    };

    // Clases de tamaño del "knob" (el círculo que se mueve)
    const knobSizes = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };

    return(

        // Botón que funciona como switch
        <button
            onClick={handleToggle} // Evento que cambia el estado
            disabled={disabled} // Permite deshabilitar el botón 
            className={`
                / /Posicionamento base del switch
                relative items-center
                
                // Forma redondeada del contenedor
                rounded-full transition-colors

                // Tamaño dinámico según la prop "size"
                ${sizes[size]}

                // Color dependiendo del estado
                ${isActive ? "bg-green-500" : "bg-gray-300"}

                // Estilo cuando está deshabilitado
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}

                ${className}
            `}
        >
            {/* "Knob" del switch (el círculo que se mueve de izquierda a derecha) */}
            <span
                className={`
                    absolute left-0.5 flex items-center justify-center    

                    // Forma del knob
                    rounded-full bg-white shadow

                    // Animación de movimiento
                    transition-transform

                    // Tamaño dinámico del knob
                    ${knobSizes[size]}

                    // Posición dependiendo del estado
                    ${isActive ? "translate-x-full" : "translate-x-0"}
                `}
            >
                {/* Icono que cambia dependiendo del estado activo-inactivo */}

                {isActive ? (
                    <Check size={12} className="text-green-600"/>
                ) : (
                    <X size={12} className="text-gray-500"/>
                )}

            </span>

        </button>

    );
}