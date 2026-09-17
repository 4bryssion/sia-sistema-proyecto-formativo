// Filtro de estado de la barra de una tabla: Activos / Inactivos / Todos.
//
// Existía copiado y pegado, idéntico, en los cuatro listados principales
// (usuarios, material de consumo, material devolutivo y préstamos). Al pedirlo
// también para marcas, inventarios y grupos habrían sido siete copias del mismo
// <select>, así que se extrajo aquí: un solo sitio donde están las etiquetas, el
// estilo y los valores que entiende el backend.
//
// NO usa el componente Select del proyecto a propósito: aquél es un campo de
// FORMULARIO (trae label, asterisco de obligatorio, ancho de campo, hueco de
// error y opción "Seleccione una opción"). Esto es un control de barra de
// herramientas, siempre con valor y sin estado vacío posible.
//
// `value` y lo que emite `onChange` son exactamente los del query param `status`
// del backend: "active" | "inactive" | "all".

const OPCIONES = [
    { value: "active",   label: "Activos" },
    { value: "inactive", label: "Inactivos" },
    { value: "all",      label: "Todos" },
];

export default function StatusFilterSelect({
    value,
    onChange,
    // Se dice qué se está filtrando para el lector de pantalla: en la barra el
    // control va suelto, sin etiqueta visible que lo acompañe.
    ariaLabel = "Filtrar por estado",
    className = "",
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            aria-label={ariaLabel}
            className={`border rounded px-3 py-2 font-secondary text-medium ${className}`}
        >
            {OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    );
}
