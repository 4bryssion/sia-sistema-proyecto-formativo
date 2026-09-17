import { Plus } from "lucide-react";
import { IconButton } from "./IconButton";

// Disparador "Crear y asignar <algo> nuevo": IconButton (+) con su texto al lado.
// Abre el modal de creación correspondiente, que al guardar autoselecciona lo
// recién creado en el select de al lado.
//
// Estaba escrito tres veces casi idéntico (marca en los dos formularios de
// material, grupo en crear usuario). Al sumar el de inventario habrían sido
// cinco, así que se extrajo. Lo único que cambiaba entre ellos era el texto y el
// tamaño del icono, que son props.
//
// Las clases de display y alineación las aporta el consumidor por `className`:
// cada formulario lo enseña u oculta en un breakpoint distinto y dos utilidades
// de display en el mismo elemento se resolverían por el orden del CSS.
export default function CreateAndAssignTrigger({
    label,
    onClick,
    className = "",
    // 36/20 en los formularios de material; 44/26 en crear usuario
    hitSize = 36,
    iconSize = 20,
    // text-caption en material, text-medium en crear usuario
    textClassName = "text-caption",
    // Contenido extra debajo del disparador (crear usuario cuelga ahí su casilla)
    children,
}) {
    return (
        <div className={`flex-col gap-3 ${className}`}>
            <div className="flex items-center gap-2">
                <IconButton ariaLabel={label} onClick={onClick} hitSize={hitSize} iconSize={iconSize}>
                    <Plus strokeWidth={2.5} />
                </IconButton>
                <button
                    type="button"
                    onClick={onClick}
                    className={`font-secondary ${textClassName} text-left cursor-pointer underline-offset-2 hover:underline`}
                >
                    {label}
                </button>
            </div>

            {children}
        </div>
    );
}
