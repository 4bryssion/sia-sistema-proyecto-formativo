// Genera los archivos de prueba GRANDES, que no se suben al repositorio por su
// tamaño (carpeta tests/fixtures/generados/, ignorada en .gitignore).
//
//   npm run test:fixtures
//
// Sirven para los casos que prueban los límites de subida de multer
// (src/middleware/multerConfig.js):
//   - archivo-11MB.pdf        → supera el máximo de 10MB POR ARCHIVO
//   - pdf-9MB-1..4.pdf        → cada uno es válido, pero juntos (36MB) superan
//                               el máximo de 30MB POR ENVÍO
//
// El contenido es relleno aleatorio con cabecera de PDF: multer decide el tipo por
// el Content-Type que manda el cliente (Postman/navegador lo toma de la extensión),
// y el relleno aleatorio hace que cada archivo tenga una huella SHA-256 distinta.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DESTINO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'generados');
const MB = 1024 * 1024;

const crearPdf = (nombre, megas) => {
  const ruta = path.join(DESTINO, nombre);
  const cabecera = Buffer.from('%PDF-1.4\n% Archivo de prueba S.I.I. - relleno aleatorio\n');
  const cierre = Buffer.from('\n%%EOF\n');
  const relleno = crypto.randomBytes(Math.round(megas * MB) - cabecera.length - cierre.length);
  fs.writeFileSync(ruta, Buffer.concat([cabecera, relleno, cierre]));
  console.log(`✓ ${nombre} (${(fs.statSync(ruta).size / MB).toFixed(1)} MB)`);
};

fs.mkdirSync(DESTINO, { recursive: true });
crearPdf('archivo-11MB.pdf', 11);
for (let i = 1; i <= 4; i += 1) crearPdf(`pdf-9MB-${i}.pdf`, 9);
console.log(`Archivos generados en ${DESTINO}`);
