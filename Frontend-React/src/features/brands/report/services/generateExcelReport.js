//Libreria para manipulacion y generacion de archivos excel
import * as XLSX from "xlsx";

//Funcion utilitaria para generar un archivo excel a partir de datos tabulares
// Patron: exportacion de datos (dataset -> archivo descargable)
export function generateExcelReport({
    headers, //Array de encabezados (columnas)
    rows, //Array de filas (Array de array)
    fileName = "brand-report.xlsx" // Nombre del archivo de salida 
}) {

    const currentData = new Date().toLocaleString();
    const reportTitle = `*** REPORTE DE MARCAS - ${currentData} ***`;
    //Estructura final de la hoja 
    //Primera fila = headers
    //siguiente fila= datos
    const worksheetData = [
        [reportTitle],
        [],
        headers,
        ...rows
    ];

    //Convierte un array de arrays (AOA= Array of Arrays) en una hoja de excel
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    //merge visual
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    worksheet["!merges"] = [{
        s: { r: 0, c: 0},
        e: { r: 0, c: range.e.c},
    }];

    //ancho de la columna
    worksheet["!cols"] = headers.map(() => ({wch: 25 }));

    //Altura fila titulo (simulacion impacto visual)
    worksheet["!rows"] = [{ hpt: 25 }];


    //crea un nuevo libro en excel (workbook)
    const workbook = XLSX.utils.book_new();

    //Agrega la hoja del libro con el nombre ususariso
    XLSX.utils.book_append_sheet(workbook, worksheet, "Marcas");

    //Genera y decarga el archivo excel en el cliente
    XLSX.writeFile(workbook, fileName);

}