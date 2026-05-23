import React from "react";
import clsx from "clsx";

export const IconButton = React.forwardRef(function IconButton (
    {
        children,
        onClick,
        disabled = false,
        className = "",
        variant = "default",

        // Tamaños
        hitSize = 48, // px (área táctil)
        iconSize = 24, // px (ícono visible)

        // Accesibilidad 
        ariaLabel,

        // Estados
        isActive = false,

        ...props
    },
    ref
){
    const baseStyles = `
        inline-flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-offset-2 disabled:pointer-events-none cursor-pointer
    `;

    const variants = {
        default: `
            text-neutral-900 
            hover:bg-neutral-200
            focus-visible:ring-neutral-400
        `,

        ghost: `
            text-neutral-600 
            hover:bg-neutral-100 
            focus-visible:ring-neutral-300  
        `,

        primary: `
            text-white bg-blue-600 
            hover:bg-blue-700 
            focus-visible:ring-blue-500
        `,
    }

    return(
        <button
            ref={ref}
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}

            className={clsx(baseStyles, variants[variant], className, {
                "bg-neutral-300" : isActive,
            })}

            style={{
                width: `${hitSize}px`,
                height: `${hitSize}px`,
            }}
            {...props}
        >
            <span
                style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                }}

                className="flex items-center justify-center"
            >
                {children}
            </span>
        </button>
    )
})