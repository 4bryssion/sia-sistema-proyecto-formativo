//Libreria para gestion de pdfs en el cliente
import jsPDF from "jspdf";

//Plugin para creacion de tablas dentro del pdf
import autoTable from "jspdf-autotable";


//Fincionutilitaria para gestion de un reporte en pdf
//patron: exportacion de datos (dataset => documento estructurado)
export function generatePdfReport({
    headers, // Encabezado de la tabla (columnas)
    rows, //datos (array de fillas)
    fileName = "brand-report.pdf", // nombre del archivo 
}) {
    const doc = new jsPDF ();

    doc.setFontSize(16);
    doc.text("Reporte de marcas", 14, 20);

    autoTable(doc, {
        startY: 30, //Posicion iniacial debajo del titulo

        head : [headers], //Encabezados
        body : rows, //filas del reporte

        theme: "grid", //estilo vsual de la tabla

        //estilo del encabezado
        headStyles: {
            fillColor: [33, 150, 243],
            textColor: 255,
            fontSize: 11,
        },

        styles: {
            fontSize: 10,
        },

        //margenes del documento
        margin: {
            left: 14,
            right: 14,
        },
    });

    //Genera y descarga el archivo PDF
    doc.save(fileName);
}