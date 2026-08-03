// Filtro compacto en forma de menú, pensado para la barra de herramientas de
// DataTable (a la derecha del SearchField).
//
// Reutiliza el Dropdown compartido, que renderiza su contenido en un portal con
// position:fixed: por eso el menú se superpone a la tabla sin que el overflow
// del contenedor lo recorte.
//
// Altura h-11 para igualar la del SearchField y la del Input del proyecto.

import { ListFilter, ChevronDown } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "./DropdownContext";

export default function FilterMenu({
    label,                 // Texto cuando no hay filtro aplicado (ej. "Tipo de usuario")
    value,                 // Valor activo; undefined | "" = sin filtro
    onChange,              // (nuevoValor) => void — recibe undefined al limpiar
    options = [],          // [{ value, label }]
    allLabel = "Todos",    // Texto de la opción que limpia el filtro
    className = "",
}) {
    const active = value !== undefined && value !== "";
    const current = options.find((o) => String(o.value) === String(value));

    return (
        // w-full hasta sm: en pantallas pequeñas la barra de la tabla se apila y
        // el filtro debe ocupar la línea completa, como el buscador
        <Dropdown className={`w-full sm:w-auto ${className}`}>
            <DropdownTrigger>
                <button
                    type="button"
                    aria-label={`Filtrar por ${label}`}
                    className={`
                        flex items-center gap-2 h-11 px-3 rounded-xl border
                        w-full sm:w-auto justify-between sm:justify-start
                        font-secondary text-sm cursor-pointer transition-colors
                        ${active
                            ? "border-focus-border bg-(--color-cuaternario-200)"
                            : "border-border bg-transparent hover:border-focus-border"}
                    `}
                >
                    <ListFilter className="size-4 shrink-0" />
                    {/* Con filtro puesto se muestra el valor elegido, no la etiqueta
                        genérica: así se ve de un vistazo que la tabla está filtrada */}
                    <span>{active ? current?.label ?? String(value) : label}</span>
                    <ChevronDown className="size-4 shrink-0" />
                </button>
            </DropdownTrigger>

            <DropdownContent className="w-56">
                <DropdownItem
                    onClick={() => onChange(undefined)}
                    className={!active ? "font-semibold" : ""}
                >
                    {allLabel}
                </DropdownItem>

                {options.map((o) => (
                    <DropdownItem
                        key={o.value}
                        onClick={() => onChange(o.value)}
                        className={String(value) === String(o.value) ? "font-semibold" : ""}
                    >
                        {o.label}
                    </DropdownItem>
                ))}
            </DropdownContent>
        </Dropdown>
    );
}
