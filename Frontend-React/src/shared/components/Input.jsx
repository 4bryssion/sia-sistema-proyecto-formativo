import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "./IconButton";

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
    // Sufijo visual PEGADO al valor, no al borde derecho: sirve para campos del
    // tipo "cantidad sobre un máximo" (se escribe 3 y se lee "3/40").
    // Se coloca midiendo el valor en unidades `ch`, que es el ancho del carácter
    // "0". Eso solo cuadra si el campo acepta ÚNICAMENTE dígitos: en las fuentes
    // del proyecto los números son tabulares (todos miden lo mismo) pero las
    // letras no, así que con texto libre el sufijo se despegaría.
    suffix,
    // revealable: en type="password" agrega el IconButton de ojo para mostrar/ocultar.
    // Se puede apagar (revealable={false}) donde no se quiera dar esa opción.
    revealable = true,
    // Ancho del campo. Es una prop y no algo que se sobrescriba con className
    // porque dos utilidades de max-width en el mismo elemento tienen la misma
    // especificidad: cuál gana lo decide el orden del CSS generado, no el del
    // atributo. El tope de 320px arranca en md porque la mayoría de formularios
    // pasa a varias columnas ahí; los que reparten más tarde (crear usuario, que
    // lo hace en lg) pasan su propio valor.
    widthClass = "w-full md:max-w-[320px]",
    ...props
}){
    // Solo aplica al campo censurado; `type` sigue siendo la fuente de verdad
    const isPassword = type === "password";
    const canReveal = isPassword && revealable && !props.disabled && !props.readOnly;
    const [revealed, setRevealed] = useState(false);

    // El type efectivo cambia a "text" mientras el usuario decide ver la contraseña
    const inputType = isPassword && revealed ? "text" : type;

    // Cuerpo de la función
    return(
        // Contenedor del input que se exporta con label, cuerpo y feedback meesage
        <div className={`${widthClass} ${className}`}>

            {/* Label */}
            {label && (
                <label 
                    className={`
                        block
                        text-caption
                        mb-1
                        place-self-start
                        font-secondary
                        
                        ${error ? "text-error" : "text-text-primary"}
                    `}
                >
                    {label}
                    {/* Asterisco de obligatorio en verde primario (token --color-required) */}
                    {required && <span className="text-required font-bold ml-0.5" aria-hidden="true">*</span>}
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
                    type={inputType}
                    className={`
                        relative
                        w-full
                        h-12
                        rounded-md
                        border
                        border-border
                        ${prefix ? "pl-8" : "pl-4"}
                        ${canReveal ? "pr-12" : "pr-4"}
                        text-base
                        font-secondary
                        
                        hover:border-2
                        hover:border-focus-border

                        focus:outline-none
                        focus:ring-1
                        focus:ring-focus-ring

                        ${error ? "border-error" : "border border-border"}
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

                {/* Sufijo pegado al valor. El desplazamiento es el padding
                    izquierdo del campo (pl-4 = 1rem, o pl-8 = 2rem si hay
                    prefijo) más un `ch` por cada dígito escrito */}
                {suffix && (
                    <span
                        className="
                            absolute
                            z-10
                            text-base
                            font-secondary
                            text-text-muted
                            pointer-events-none
                            select-none
                        "
                        style={{
                            left: `calc(${prefix ? "2rem" : "1rem"} + ${String(props.value ?? "").length}ch)`,
                        }}
                    >
                        {suffix}
                    </span>
                )}

                {/* Mostrar/ocultar contraseña. z-20 para quedar por encima del overlay
                    invisible de foco (que es el primer hijo y ocupa todo el contenedor);
                    sin eso el clic nunca llegaría al botón */}
                {canReveal && (
                    <IconButton
                        className="absolute right-2 z-20 text-text-primary"
                        hitSize={40}
                        iconSize={20}
                        ariaLabel={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setRevealed((prev) => !prev)}
                        tabIndex={-1}
                    >
                        {revealed ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
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