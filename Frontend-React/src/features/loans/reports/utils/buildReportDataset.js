// Función utilitaria para construir el dataset de un reporte (tabla)
// Patrón: transformación de datos (input -> output listo para exportar)

export function buildReportDataset({
    loans,          // Array de préstamos origen
    selectedFields, // Campos seleccionados para el reporte [{key, label}]
    scope,          // Alcance del reporte: "all" | "user"
    usuario         // Nombre de usuario para filtrar (si aplica)
}) {
    // Copia inmutable del array original (evita mutaciones)
    let filteredLoans = [...loans];

    // Filtro por alcance: si es por usuario, se aplica filtro específico
    if (scope === "user" && usuario) {
        filteredLoans = filteredLoans.filter(
            (loan) => loan.usuario === usuario
        );
    }

    // Construcción de encabezados del reporte
    // Se toma el label de cada campo seleccionado
    const headers = selectedFields.map((field) => field.label);

    // Construcción de filas del reporte
    // Cada préstamo se transforma en un array de valores según los campos seleccionados
    const rows = filteredLoans.map((loan) =>
        selectedFields.map((field) => {
            const value = loan[field.key]; // Acceso dinámico a la propiedad
            // Normalización: evita undefined o null en el reporte
            return value ?? "";
        })
    );

    // Estructura final desacoplada de la UI
    // Lista para exportar en Excel, PDF, o renderizar en tabla
    return {
        headers, // Array de strings (columnas)
        rows     // Array de arrays (filas)
    };
}