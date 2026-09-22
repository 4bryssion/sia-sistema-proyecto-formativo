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

        // (p50) Punto de aviso sobre el icono (la campana de notificaciones).
        // Va aquí y no en el consumidor porque el punto tiene que posicionarse
        // contra el botón, y el botón es quien conoce su propio tamaño.
        badge = false,
        badgeLabel,

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
            text-white
            hover:bg-blue-700
            focus-visible:ring-blue-500
        `,

        // Para superficies oscuras o de color (navbar): icono blanco y hover con
        // velo translúcido, que funciona sobre cualquier punto del gradiente.
        // Va como variante y no como className del consumidor porque dos
        // utilidades de color de Tailwind con la misma especificidad se resuelven
        // por el orden del CSS generado, no por el orden en el atributo class.
        onColor: `
            text-black
            sm:text-[var(--color-gray-900)]
            hover:bg-white/20
            focus-visible:ring-white
        `,

        // Fondo oscuro a CUALQUIER ancho: las pantallas de autenticación, que
        // van sobre la imagen de fondo. Se separa de `onColor` porque esa cambia
        // de color según el ancho (es del navbar, que solo es oscuro a partir de
        // cierto tamaño) y aquí el fondo es oscuro siempre.
        onDark: `
            text-text-inverse
            hover:bg-white/20
            focus-visible:ring-white
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
                // `relative` SOLO cuando hay punto, y nunca por defecto: es la
                // ancla que el punto necesita. Puesto en los estilos base le
                // ganaba al `absolute` con el que algunos consumidores colocan
                // el botón —el ojo de ver contraseña dentro del Input— porque
                // entre dos utilidades de posición decide el orden del CSS
                // generado, no el del atributo class.
                "relative": badge,
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

            {/* El punto se dibuja DENTRO del botón, anclado a su esquina, y no
                como un hermano posicionado a ojo: así acompaña al icono sea cual
                sea el tamaño con el que se use el botón.
                aria-hidden + texto solo para lectores: el punto es decorativo,
                lo que se anuncia es la frase. */}
            {badge && (
                <>
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-2.5 top-2.5 size-2.5 rounded-full bg-(--color-secondary-600) ring-2 ring-white"
                    />
                    <span className="sr-only">{badgeLabel ?? "Hay novedades"}</span>
                </>
            )}
        </button>
    )
})