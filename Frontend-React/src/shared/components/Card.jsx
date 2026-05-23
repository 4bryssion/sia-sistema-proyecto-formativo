import { cloneElement } from "react";

export default function Card({
    icon, // Icono de la card
    title, // Título de la card
    description, // Descripción de que función cumple el contenido
    children, // Botón de la card para redirigir
    className = "",
    ...props // Propiedades adicionales (disabled, etc)
}){

    return(
        <div
            className={`
                w-80 h-full flex flex-col
                text-text
                border
                bg-white/80 hover:bg-neutral-100/80 backdrop-blur-[2px] shadow-lg rounded-2xl overflow-hidden hover:shadow-black transition-all duration-700
                ${className}
            `}
            {...props}
        >
            {/* Icono de la card */}
            <div
                className="
                    flex items-center justify-center w-full py-6
                "
            >
                {cloneElement(icon, { size: 94 })}
            </div>

            {/* Contenido de la card */}
            <div
                className="flex flex-col flex-1 px-6 pb-6 gap-3 text-center"
            >
                {/* Título de la card */}
                <h2
                    className="text-h2 font-heading font-main flex items-center justify-center min-h-14" 
                >
                    {title}
                </h2>

                {/* Descripción */}
                <p className="text-body font-secondary flex-1">
                    {description?.split(" ").map((word, i) => (
                        <span key={i} className="block">{word}</span>
                    ))}
                </p>

                <div className="flex justify-center">
                    {children}
                </div>
            </div>
        </div>
    )
}