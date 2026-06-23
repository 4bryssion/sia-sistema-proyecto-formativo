import { buildReportDataset } from "../utils/buildReportDataset";
import { generateExcelReport } from "./genarateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

export function generateUserReport({
    users = [],
    format,
    selectedFields,
    scope,
    documentNumber
}) {

    const { headers, rows } = buildReportDataset({
        users,
        selectedFields,
        scope,
        documentNumber
    });

    //VALIDACION: EVITA GENERACCION DE ARCHIVOS VACIOS

    if (!rows.length) {
        alert("No hay datos para genera el reporte");
        return; //Corte de ejecucion
    }

    //Generacion de timestamp para nombre uniocs de archivo (YYYY-MM-DD)
    //toISOString(): convierte un afecha a formato estandar UTC
    const timestamp = new Date().toISOString().slice(0, 10);

    //Seleccion de estrategias de eportacion segun formato
    if (format === "excel") {
        generateExcelReport({
            headers,
            rows,
            fileName : `users-report-${timestamp}.xlsx`
        });
    }

    if (format === "pdf") {
        generatePdfReport({
            headers,
            rows,
            fileName: `users-report-${timestamp}.pdf`
        });
    }
}