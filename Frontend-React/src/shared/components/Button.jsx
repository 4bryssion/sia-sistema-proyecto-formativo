// Componente Boton - Boton reutilizable con variantes visuales y tamaños controlados, área interactiva mínima de 48px

import { useState } from "react";

export default function Button({
    variant = "primary", // Define el estilo visual: "primary" | "secondary" | "toggle"
    size = "md", // Define tamaño visual
    type = "button", // Tipos de botón(buttom, submit, reset)
    children, // Contenido interno del botón(texto, icono)
    className,
    defaultActive = true, // Solo para variant="toggle": true arranca en primario, false en secundario
    activeLabel,   // Solo para variant="toggle": texto cuando isActive=true
    inactiveLabel, // Solo para variant="toggle": texto cuando isActive=false
    onClick,
    ...props // Propiedades adicionales (disabled, etc)
}){
    const [isActive, setIsActive] = useState(defaultActive);

    const variants = {
        primary: "bg-button-primary text-text-inverse  border border-border rounded hover:bg-button-primary-hover",

        secondary: "bg-button-secondary text-text-inverse border border-border hover:bg-button-secondary-hover",

        toggle: isActive
            ? "bg-button-primary text-text-inverse border-border rounded hover:bg-button-primary-hover"

            : "bg-button-secondary text-text-inverse border border-border hover:bg-button-secondary-hover",
    }

    const sizes = {
        sm: `
            h-9 px-3
            before:absolute before:content-['']
            before:-inset-y-[6px] before:-inset-x-[0px]
        `,
        md: `
            h-10 px-4
            before:absolute before:content-['']
            before:-inset-y-[5px] before:-inset-x-[0px]
        `
    }

    const handleClick = (e) => {
        // El prev => !prev simplemente invierte el booleano actual: si era true pasa a false y viceversa.
        if (variant === "toggle") setIsActive(prev => !prev);

        // onClick?.(e) 
        // El ?. es optional chaining — llama a onClick solo si el padre pasó esa prop. Si no se pasó ningún onClick, no falla, simplemente no hace nada. Esto preserva el comportamiento normal del botón para quien lo use.
        onClick?.(e);
    };

    return(

        <button
            type={type}
            className= {`
                w-max
                relative
                inline-flex
                items-center
                justify-center
                rounded-md
                cursor-pointer
                transition-all
                duration-200
                active:scale-95
                font-main
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            onClick={handleClick}
            {...props}

        >
            {variant === "toggle" && activeLabel && inactiveLabel
                ? (isActive ? activeLabel : inactiveLabel)
                : children
            }
        </button>

    )


}
