/**
 * Diagnóstico del envío de correo (SMTP).
 *
 * Existe porque "el correo dice enviado pero no llega" tiene tres causas muy
 * distintas y desde la app no se distinguen: (1) el SMTP rechazó la autenticación,
 * (2) Gmail aceptó el mensaje pero lo clasificó como spam, (3) el destinatario es
 * la MISMA cuenta que envía (Gmail no duplica el mensaje en la bandeja de entrada:
 * queda en "Enviados" / "Todos"). Este script separa los tres casos.
 *
 * Uso (desde Backend-ExpressJS/):
 *   node scripts/mail-doctor.js                      → solo verifica la conexión
 *   node scripts/mail-doctor.js destino@correo.com   → verifica y envía un correo de prueba
 *   node scripts/mail-doctor.js --preview            → genera los HTML en scripts/preview/
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { layout, p, codeBox, dataBox, notice, button, small } from '../src/config/mailTemplates.js';

const arg = process.argv[2];
const raw = process.env.EMAIL_APP_PASSWORD ?? '';
const clean = raw.replace(/\s+/g, '');

console.log('\n=== Configuración de correo (.env) ===');
console.log('EMAIL_HOST        :', process.env.EMAIL_HOST);
console.log('EMAIL_PORT        :', process.env.EMAIL_PORT);
console.log('EMAIL_SECURE      :', process.env.EMAIL_SECURE);
console.log('EMAIL_USER        :', process.env.EMAIL_USER);
console.log('EMAIL_FROM        :', process.env.EMAIL_FROM);
console.log('APP_PASSWORD      :', `${clean.length} caracteres útiles (${raw.length} en el .env)`);
if (raw.length !== clean.length) {
  console.log('  → La contraseña tiene espacios en el .env. El código ya los limpia,');
  console.log('    pero conviene guardarla sin espacios para evitar confusiones.');
}
if (clean.length !== 16) {
  console.log('  ⚠ Una contraseña de aplicación de Google tiene EXACTAMENTE 16 caracteres.');
  console.log('    Si no coincide, genera una nueva en https://myaccount.google.com/apppasswords');
}

// --preview: escribe los HTML a disco para revisarlos en el navegador sin enviar nada
if (arg === '--preview') {
  const dir = path.resolve('scripts/preview');
  fs.mkdirSync(dir, { recursive: true });
  const loginUrl = `${process.env.FRONTEND_URL}/auth`;

  const files = {
    'recuperacion.html': layout({
      title: 'Recuperación de contraseña',
      preview: 'Tu código de recuperación es 482910.',
      body: [
        p('Recibimos una solicitud para restablecer la contraseña de tu cuenta en el S.I.I. Usa este código para continuar:'),
        codeBox('482910'),
        notice('El código vence en <strong>15 minutos</strong> y solo puede usarse una vez.'),
        small('Si no solicitaste este cambio, ignora este correo: tu contraseña actual sigue siendo válida.'),
      ].join(''),
    }),
    'credenciales.html': layout({
      title: 'Bienvenido al S.I.I, Sofía Cardona',
      preview: 'Tu cuenta fue creada. Estas son tus credenciales de acceso.',
      body: [
        p('Tu cuenta en el <strong>Software de Inventario de Infraestructura</strong> ya está activa. Ingresa con estas credenciales:'),
        dataBox([
          { label: 'Correo de acceso', value: 'sofia@correo.com' },
          { label: 'Contraseña temporal', value: 'Xk7#pQ2m' },
        ]),
        notice('Esta es una <strong>contraseña temporal</strong>. Por seguridad te recomendamos cambiarla apenas ingreses por primera vez.'),
        button(loginUrl, 'Ingresar al S.I.I'),
        small('Si no reconoces esta cuenta, comunícate con el administrador del sistema.'),
      ].join(''),
    }),
  };

  for (const [name, html] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), html, 'utf8');
    console.log('Escrito:', path.join('scripts/preview', name));
  }
  console.log('\nÁbrelos en el navegador para revisar el diseño.\n');
  process.exit(0);
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: { user: process.env.EMAIL_USER, pass: clean },
  logger: true, // traza del diálogo SMTP: aquí se ve el rechazo exacto si lo hay
});

console.log('\n=== Verificando conexión SMTP ===');
try {
  await transporter.verify();
  console.log('✔ Conexión y autenticación correctas.');
} catch (err) {
  console.error('✘ Falló la conexión:', err.message);
  console.error('  code:', err.code, '| responseCode:', err.responseCode);
  process.exit(1);
}

if (!arg) {
  console.log('\nSin destinatario: no se envió nada.');
  console.log('Para probar un envío: node scripts/mail-doctor.js tu-otro-correo@dominio.com\n');
  process.exit(0);
}

if (arg.toLowerCase() === (process.env.EMAIL_USER ?? '').toLowerCase()) {
  console.log('\n⚠ El destinatario es la MISMA cuenta que envía.');
  console.log('  Gmail no vuelve a poner en la bandeja de entrada un mensaje que tú mismo enviaste:');
  console.log('  búscalo en "Enviados" o en "Todos los mensajes". Prueba mejor con OTRO correo.\n');
}

console.log('\n=== Enviando correo de prueba a', arg, '===');
try {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: arg,
    subject: 'Prueba de envío — S.I.I',
    text: 'Si estás leyendo esto, el SMTP del S.I.I funciona correctamente.',
    html: layout({
      title: 'Prueba de envío',
      preview: 'Verificación del servicio de correo del S.I.I.',
      body: p('Si estás leyendo esto, el servicio de correo del S.I.I está configurado correctamente.'),
    }),
  });
  console.log('✔ Enviado.');
  console.log('  aceptados :', info.accepted);
  console.log('  rechazados:', info.rejected);
  console.log('  messageId :', info.messageId);
  console.log('  respuesta :', info.response);
  console.log('\nSi "aceptados" trae la dirección y aun así no llega, el problema NO es el');
  console.log('backend: revisa Spam / Promociones / "Todos los mensajes" en el destinatario.\n');
} catch (err) {
  console.error('✘ Falló el envío:', err.message);
  console.error('  code:', err.code, '| responseCode:', err.responseCode);
  process.exit(1);
}
