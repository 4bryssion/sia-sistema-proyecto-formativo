import nodemailer from 'nodemailer';
import {
  layout,
  p,
  small,
  codeBox,
  dataBox,
  notice,
  // `steps` queda disponible en mailTemplates para el paso a paso de cambio de
  // contraseña, pendiente de definir el flujo de "Mi Perfil → Cambiar contraseña"
  list,
  button,
  subtitle,
} from './mailTemplates.js';

// Google muestra la contraseña de aplicación en grupos de 4 ("abcd efgh ijkl mnop").
// Si se pega tal cual al .env, la autenticación SMTP falla o queda inestable.
// Se limpian espacios aquí para que el .env pueda tenerla en cualquiera de las dos formas.
const APP_PASSWORD = (process.env.EMAIL_APP_PASSWORD ?? '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: APP_PASSWORD,
  },
});

// Diagnóstico de arranque: sin esto, un SMTP mal configurado solo se descubre
// cuando un usuario real no recibe su correo. Es asíncrono y no bloquea el server.
export const verifyMailer = async () => {
  try {
    await transporter.verify();
    console.log(`[mailer] SMTP listo — ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT} como ${process.env.EMAIL_USER}`);
    return true;
  } catch (err) {
    console.error('[mailer] SMTP NO disponible:', err.message);
    return false;
  }
};

// Envoltura única de sendMail: deja registro de lo que el servidor SMTP respondió.
// `accepted`/`rejected` son la única prueba de que Gmail tomó el mensaje; sin este
// log, "el correo no llega" es indistinguible de "el correo nunca se envió".
const send = async (options) => {
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM, ...options });
  console.log(
    `[mailer] "${options.subject}" → aceptados: ${JSON.stringify(info.accepted)} · rechazados: ${JSON.stringify(info.rejected)} · id: ${info.messageId} · respuesta: ${info.response}`,
  );
  return info;
};

export const sendPasswordResetCode = async (to, code) => {
  const html = layout({
    title: 'Recuperación de contraseña',
    preview: `Tu código de recuperación es ${code}. Vence en 15 minutos.`,
    body: [
      p('Recibimos una solicitud para restablecer la contraseña de tu cuenta en el S.I.I. Usa este código para continuar:'),
      codeBox(code),
      notice('El código vence en <strong>15 minutos</strong> y solo puede usarse una vez.'),
      small('Si no solicitaste este cambio, ignora este correo: tu contraseña actual sigue siendo válida.'),
    ].join(''),
  });

  await send({
    to,
    subject: 'Código de recuperación de contraseña — S.I.I',
    text: `Tu código de recuperación es: ${code}. Vence en 15 minutos. Si no lo solicitaste, ignora este correo.`,
    html,
  });
};

// Envío de credenciales de inicio de sesión al crear un usuario (correo personal).
// Se llama ANTES de responder al cliente para poder informar si el envío falló.
export const sendUserCredentials = async (to, { name, email, password }) => {
  const loginUrl = `${process.env.FRONTEND_URL}/auth`;

  // PENDIENTE: el paso a paso para cambiar la contraseña se agrega cuando esté
  // definido el flujo de "Mi Perfil → Cambiar contraseña". Hasta entonces el
  // correo solo advierte que la contraseña es temporal.
  const html = layout({
    title: `Bienvenido al S.I.I, ${name}`,
    preview: 'Tu cuenta fue creada. Estas son tus credenciales de acceso.',
    body: [
      p('Tu cuenta en el <strong>Software de Inventario de Infraestructura</strong> ya está activa. Ingresa con estas credenciales:'),
      dataBox([
        { label: 'Correo de acceso', value: email },
        { label: 'Contraseña temporal', value: password },
      ]),
      notice(
        'Esta es una <strong>contraseña temporal</strong>. Por seguridad te recomendamos cambiarla apenas ingreses por primera vez.',
      ),
      button(loginUrl, 'Ingresar al S.I.I'),
      small('Si no reconoces esta cuenta, comunícate con el administrador del sistema.'),
    ].join(''),
  });

  await send({
    to,
    subject: 'Tus credenciales de acceso — S.I.I',
    text: `Hola ${name},

Tu cuenta en el S.I.I fue creada. Estas son tus credenciales de inicio de sesión:

Correo: ${email}
Contraseña temporal: ${password}

Esta contraseña es temporal; te recomendamos cambiarla apenas ingreses por primera vez.

Ingresa en: ${loginUrl}`,
    html,
  });
};

// Clasifica un error de nodemailer para las alertas dinámicas del frontend:
// 'invalid_recipient' → el SMTP rechazó la dirección; 'service_error' → fallo de conexión/servicio
export const classifyMailError = (err) => {
  const rejectedByServer =
    err?.code === 'EENVELOPE' ||
    (typeof err?.responseCode === 'number' && err.responseCode >= 500 && err.responseCode < 560);
  return rejectedByServer ? 'invalid_recipient' : 'service_error';
};

export const sendLoanSignatureRequest = async (to, { partyLabel, loan, signUrl }) => {
  const lines = loan.materials
    .map((m) => `- ${m.consumableMaterial.materialName} x${m.borrowedQuantity}`)
    .join('\n');
  const items = loan.materials.map(
    (m) => `${m.consumableMaterial.materialName} <strong>x${m.borrowedQuantity}</strong>`,
  );
  const returnDate = loan.returnDate.toISOString().slice(0, 10);

  const html = layout({
    title: `Firma requerida — Préstamo #${loan.id}`,
    preview: `Tienes un préstamo pendiente de firma como ${partyLabel}.`,
    body: [
      p(`Tienes un préstamo pendiente de firma en calidad de <strong>${partyLabel}</strong>. El préstamo solo queda activo cuando ambas partes firman.`),
      subtitle('Materiales'),
      list(items),
      dataBox([
        { label: 'Grupo de aprendices', value: loan.apprenticeGroup },
        { label: 'Justificación de uso', value: loan.useJustification },
        { label: 'Fecha de devolución', value: returnDate },
      ]),
      button(signUrl, 'Firmar préstamo'),
      notice('El enlace de firma vence en <strong>7 días</strong>.'),
      small('Si no reconoces este préstamo, comunícate con el administrador del sistema antes de firmar.'),
    ].join(''),
  });

  await send({
    to,
    subject: `Firma requerida — Préstamo #${loan.id} — S.I.I`,
    text: `Tienes un préstamo pendiente de firma como ${partyLabel}.\n\nMateriales:\n${lines}\n\nGrupo: ${loan.apprenticeGroup}\nJustificación: ${loan.useJustification}\nFecha de devolución: ${returnDate}\n\nFirma aquí (vence en 7 días): ${signUrl}`,
    html,
  });
};
