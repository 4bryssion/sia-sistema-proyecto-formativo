// Fuente de datos de materiales consumibles (mock o fuente centralizada)
import { consumableMaterials } from "../../data/consumableMaterial";

// Utilidad para transformar datos en dataset de reporte
import { buildReportDataset } from "../utils/buildReportDataset";

// Servicios de exportación
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

// Caso de uso: orquestador de generación de reportes de materiales consumibles
// Patrón: Application Service (coordina utilidades y servicios)
export function generateConsumableReport({

    format, // "excel" | "pdf"
    selectedFields, // Campos seleccionados por el usuario
    scope, // Alcance del reporte
    documentNumber // Filtro opcional por placa SENA

}){
    // Construcción del dataset (desacoplado de la UI)
    const { headers, rows } = buildReportDataset({
        consumableMaterials,
        selectedFields,
        scope,
        placa_sena: documentNumber
    });

    // Validación: evita generar archivos vacíos
    if(!rows.length){
        alert("No hay datos para generar el reporte.")
        return; // Corte de ejecución
    }

    // Generación de timestamp para nombres únicos de archivo (YYYY-MM-DD)
    const timestamp = new Date().toISOString().slice(0, 10);

    // Selección de estrategia de exportación según formato
    if (format === "excel"){
        generateExcelReport({
            headers,
            rows,
            fileName: `consumableMaterials-report-${timestamp}.xlsx`
        });
    }

    if (format === "pdf"){
        generatePdfReport({
            headers,
            rows,
            fileName: `consumableMaterials-report-${timestamp}.pdf`
        });
    }
}