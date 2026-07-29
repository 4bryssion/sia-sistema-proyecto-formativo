// Generador de PDF mínimo para las fichas técnicas de los datos de demostración.
//
// Por qué a mano y no con una librería: el backend no tiene ninguna de PDF
// (los reportes se generan en el navegador con jsPDF) y no vale la pena sumar
// una dependencia de producción para un archivo de relleno que solo existe en
// el entorno de pruebas.
//
// El PDF se arma con los 5 objetos mínimos que exige la especificación
// (catálogo, árbol de páginas, página, fuente y contenido) y una tabla xref con
// los desplazamientos reales de cada objeto — de ahí que se vaya midiendo el
// buffer mientras se escribe: si un offset no coincide, el visor lo rechaza.

// Los paréntesis y la barra delimitan las cadenas en PDF: hay que escaparlos.
// Además el texto se pasa a ASCII porque la fuente base Helvetica se codifica
// en WinAnsi y las tildes saldrían como caracteres sueltos.
const escaparTexto = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([\\()])/g, '\\$1');

/**
 * PDF de una página con un título y varias líneas de texto.
 * @param {string} titulo
 * @param {string[]} lineas
 * @returns {Buffer}
 */
export function crearPdfSimple(titulo, lineas = []) {
  const contenido = [
    'BT',
    `/F1 16 Tf 60 780 Td (${escaparTexto(titulo)}) Tj`,
    'ET',
    ...lineas.map((linea, i) =>
      `BT /F1 11 Tf 60 ${740 - i * 18} Td (${escaparTexto(linea)}) Tj ET`,
    ),
  ].join('\n');

  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
      + '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(contenido, 'latin1')} >>\nstream\n${contenido}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  objetos.forEach((cuerpo, i) => {
    // El offset se mide ANTES de escribir el objeto: es la posición en bytes
    // donde arranca, que es justo lo que la tabla xref debe apuntar
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${cuerpo}\nendobj\n`;
  });

  const inicioXref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objetos.length + 1}\n`;
  // La entrada 0 siempre es la cabeza de la lista de objetos libres
  pdf += '0000000000 65535 f \n';
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${inicioXref}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}
