// Fuente de datos de préstamos (mock o fuente centralizada)
import { loans } from "../../data/loan";

// Utilidad para transformar datos del reporte
import { buildReportDataset } from "../utils/buildReportDataset";

// Servicios de exportación
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

// Caso de uso: orquestador de generación de reporte de préstamos
// Patrón: application service (coordina utilidades y servicios)
export function generateLoanReport({
    format,         // "excel" | "pdf"
    selectedFields, // Campos seleccionados por el usuario
    scope,          // Alcance del reporte
    usuario         // Filtro opcional por usuario
}) {
    // Construcción del dataset (desacoplado de la UI)
    const { headers, rows } = buildReportDataset({
        loans,
        selectedFields,
        scope,
        usuario
    });

    // Validación: evita generar archivos vacíos
    if (!rows.length) {
        alert("No hay datos para generar reporte.");
        return; // Corte de ejecución
    }

    // Generación de timestamp para nombres únicos de archivos (YYYY-MM-DD)
    // toISOString() convierte una fecha a formato estándar UTC
    const timestamp = new Date().toISOString().slice(0, 10);

    // Selección de estrategia de exportación según formato
    if (format === "excel") {
        generateExcelReport({
            headers,
            rows,
            fileName: `loan-report.${timestamp}.xlsx`
        });
    }
    if (format === "pdf") {
        generatePdfReport({
            headers,
            rows,
            fileName: `loan-report.${timestamp}.pdf`
        });
    }
}