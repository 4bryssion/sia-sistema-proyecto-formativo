// Función utilitaria para construir el dataset de un reporte (tabla)

// Patrón: transformación de datos (input => output listo para exportar)

export function buildReportDataset({

    consumableMaterials, // Array de materiales consumibles origen
    selectedFields, // Campos seleccionados para el reporte [{ key, label }]
    scope, // Alcance del reporte: "all" | "placa_sena"
    placa_sena // Placa SENA para filtrar (si aplica)

}){

    // Copia inmutable del array original (evita mutaciones)
    let filteredConsumableMaterials = [...consumableMaterials];

    // Filtro por alcance: si es por placa SENA, aplica filtro específico
    if (scope === "placa_sena" && placa_sena) {
        filteredConsumableMaterials = filteredConsumableMaterials.filter(
            (item) => item.placa_sena === placa_sena
        );
    }

    // Construcción de encabezados del reporte
    // Se toma el label de cada campo seleccionado
    const headers = selectedFields.map((field) => field.label);

    // Construcción de filas del reporte
    // Cada material se transforma en un array de valores según los campos seleccionados
    const rows = filteredConsumableMaterials.map((item) =>
        selectedFields.map((field) => {
            const value = item[field.key]; // Acceso dinámico a la propiedad

            // Normalización: evita undefined o null en el reporte
            return value ?? "";
        })
    );

    // Estructura final desacoplada de la UI
    // Lista para exponer a Excel, PDF o renderizar en tabla
    return {
        headers,  // Array de strings (columnas)
        rows // Array de arrays (filas)
    }
}