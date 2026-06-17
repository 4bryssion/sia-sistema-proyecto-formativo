// Librería para generación de PDFs en el cliente
import jsPDF from "jspdf";

// Plugin para creación de tablas dentro del PDF
import autoTable from "jspdf-autotable";

// Función utilitaria para generar un reporte PDF
// Patrón: exportación de datos (dataset => documento estructurado)
export function generatePdfReport({

    headers, // Encabezados de la tabla (columnas)
    rows, // Datos (Array de filas)
    fileName = "returnable-report.pdf" // Nombre del archivo de salida

}){
    // Inicialización del documento PDF
    const doc = new jsPDF();

    // Configuración del título
    doc.setFontSize(16);
    doc.text("Reporte de Materiales Retornables", 14, 20); // Posición (x, y)

    // Generación de tabla automática
    autoTable(doc, {
        startY: 30, // Posición inicial debajo del título

        head: [headers], // Encabezados (debe ser array de arrays)
        body: rows, // Filas del reporte

        theme: "grid", // Estilo visual de la tabla

        // Estilos del encabezado
        headStyles: {
            fillColor: [33, 150, 243], // Color de fondo (RGB)
            textColor: 255, // Color del texto
            fontSize: 11,
        },

        // Estilos globales de las celdas
        styles: {
            fontSize: 10,
        },

        // Márgenes del documento
        margin: {
            left: 14,
            right: 14,
        },
    });

    // Genera y descarga el archivo PDF
    doc.save(fileName);
}