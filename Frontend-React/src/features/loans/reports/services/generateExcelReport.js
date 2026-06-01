// Librería para manipulación y generación de archivos Excel
import * as XLSX from "xlsx";

// Función utilitaria para generar un archivo Excel a partir de datos tabulares
// Patrón: exportación de datos (dataset => archivo descargable)
export function generateExcelReport({

    headers,                            // Array de encabezados (columnas)
    rows,                               // Array de filas (array de arrays)
    fileName = "loan-report.xlsx"       // Nombre del archivo de salida

}) {

    const currentDate = new Date().toLocaleDateString();
    const reportTitle = `---------- REPORTE DE PRÉSTAMOS - ${currentDate} ----------`;

    // Estructura final de la hoja:
    // Primera fila = título
    // Segunda fila = vacía
    // Tercera fila = headers
    // Siguientes filas = datos
    const worksheetData = [
        [reportTitle],
        [],
        headers,
        ...rows
    ];

    // Convierte un array de arrays (AOA = Array of Arrays) en una hoja de Excel
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge visual del título
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    worksheet["!merges"] = [{
        s: { r: 0, c: 0 },
        e: { r: 0, c: range.e.c }
    }];

    // Ancho de columnas
    worksheet["!cols"] = headers.map(() => ({ wch: 25 }));

    // Altura de filas
    worksheet["!rows"] = [{ hpt: 25 }];

    // Crea un nuevo libro de Excel (workbook)
    const workbook = XLSX.utils.book_new();

    // Agrega la hoja al libro con el nombre "Préstamos"
    XLSX.utils.book_append_sheet(workbook, worksheet, "Préstamos");

    // Genera y descarga el archivo Excel en el cliente
    XLSX.writeFile(workbook, fileName);
}