import nodemailer from 'nodemailer';
import {
  layout,
  p,
  small,
  codeBox,
  dataBox,
  notice,
  // (p48) El paso a paso de "Mi perfil → Cambiar contraseña" ya está definido, así
  // que `steps` por fin se usa en el correo de credenciales
  steps,
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
// Fecha larga en español para los correos. Se fuerza timeZone UTC porque las dos
// fechas son columnas DATE (sin hora): sin esto, en UTC-5 mostrarían el día anterior.
const fechaLarga = (fecha) =>
  new Date(fecha).toLocaleDateString('es-CO', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  });

// Paso a paso de "Mi perfil → Cambiar contraseña". Vive aquí y no en la plantilla
// porque lo usan dos correos (credenciales y reactivación) y describe una pantalla
// concreta del sistema, no la maquetación.
const PASOS_CAMBIO_CLAVE = [
  'Ingresa al S.I.I con la contraseña temporal de este correo.',
  'Abre el menú de tu usuario, arriba a la derecha, y entra a <strong>Mi perfil</strong>.',
  'Pulsa <strong>Cambiar contraseña</strong>.',
  'Escribe tu contraseña actual (la temporal) y luego la nueva, dos veces.',
  'Guarda. Te llegará un correo confirmando el cambio.',
];

// Envío de credenciales de inicio de sesión al crear un usuario (correo personal).
// Se llama ANTES de responder al cliente para poder informar si el envío falló.
//
// (p48) `startDate` decide el tono del correo: si el vínculo empieza en el futuro,
// la cuenta existe pero NO deja entrar todavía, y decirlo aquí evita que la persona
// crea que sus credenciales están mal cuando el login la rechace.
export const sendUserCredentials = async (to, { name, email, password, startDate, endDate }) => {
  const loginUrl = `${process.env.FRONTEND_URL}/auth`;

  // Comparación por fecha de calendario, no por instante: `startDate` es una
  // columna DATE y `new Date(...)` la sitúa a medianoche UTC (bug transversal del
  // proyecto). Con toLocaleDateString('en-CA') ambas quedan como 'YYYY-MM-DD'.
  const hoy = new Date().toLocaleDateString('en-CA');
  const inicio = new Date(startDate).toLocaleDateString('en-CA', { timeZone: 'UTC' });
  const empiezaDespues = inicio > hoy;

  const avisoVigencia = empiezaDespues
    ? notice(
        `Tu acceso se habilita el <strong>${fechaLarga(startDate)}</strong>. ` +
        'Antes de esa fecha el sistema no te dejará iniciar sesión, aunque tus credenciales sean correctas.',
      )
    : notice('Tu acceso ya está habilitado: puedes ingresar desde ahora.');

  const html = layout({
    title: `Bienvenido al S.I.I, ${name}`,
    preview: empiezaDespues
      ? `Tu cuenta fue creada. Podrás ingresar a partir del ${fechaLarga(startDate)}.`
      : 'Tu cuenta fue creada. Estas son tus credenciales de acceso.',
    body: [
      p('Tu cuenta en el <strong>Software de Inventario de Infraestructura</strong> ya fue creada. Estas son tus credenciales:'),
      dataBox([
        { label: 'Correo de acceso', value: email },
        { label: 'Contraseña temporal', value: password },
        { label: 'Acceso habilitado desde', value: fechaLarga(startDate) },
        { label: 'Acceso habilitado hasta', value: fechaLarga(endDate) },
      ]),
      avisoVigencia,
      notice(
        'Esta contraseña es <strong>temporal</strong>. En tu primer inicio de sesión el sistema ' +
        'te pedirá cambiarla y no podrás usar el resto de la aplicación hasta hacerlo.',
      ),
      subtitle('Cómo cambiar tu contraseña'),
      steps(PASOS_CAMBIO_CLAVE),
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
Acceso habilitado desde: ${fechaLarga(startDate)}
Acceso habilitado hasta: ${fechaLarga(endDate)}

${empiezaDespues
  ? `IMPORTANTE: no podrás iniciar sesión antes del ${fechaLarga(startDate)}, aunque tus credenciales sean correctas.`
  : 'Tu acceso ya está habilitado: puedes ingresar desde ahora.'}

Esta contraseña es temporal. En tu primer inicio de sesión el sistema te pedirá cambiarla
y no podrás usar el resto de la aplicación hasta hacerlo.

Cómo cambiar tu contraseña:
${PASOS_CAMBIO_CLAVE.map((paso, i) => `${i + 1}. ${paso.replace(/<[^>]+>/g, '')}`).join('\n')}

Ingresa en: ${loginUrl}`,
    html,
  });
};

// (p48) Reactivación de un usuario desactivado. NO lleva credenciales: la
// contraseña del usuario sigue siendo la suya, solo cambió su vigencia.
export const sendUserReactivated = async (to, { name, startDate, endDate }) => {
  const loginUrl = `${process.env.FRONTEND_URL}/auth`;
  const hoy = new Date().toLocaleDateString('en-CA');
  const inicio = new Date(startDate).toLocaleDateString('en-CA', { timeZone: 'UTC' });
  const empiezaDespues = inicio > hoy;

  const html = layout({
    title: `Tu cuenta fue reactivada, ${name}`,
    preview: 'Tu cuenta en el S.I.I volvió a estar activa.',
    body: [
      p('Tu cuenta en el <strong>Software de Inventario de Infraestructura</strong> fue reactivada con una nueva vigencia:'),
      dataBox([
        { label: 'Acceso habilitado desde', value: fechaLarga(startDate) },
        { label: 'Acceso habilitado hasta', value: fechaLarga(endDate) },
      ]),
      empiezaDespues
        ? notice(`Podrás iniciar sesión a partir del <strong>${fechaLarga(startDate)}</strong>.`)
        : notice('Ya puedes iniciar sesión con tu contraseña de siempre.'),
      small('Si no esperabas esta reactivación, comunícate con el administrador del sistema.'),
      button(loginUrl, 'Ingresar al S.I.I'),
    ].join(''),
  });

  await send({
    to,
    subject: 'Tu cuenta fue reactivada — S.I.I',
    text: `Hola ${name},

Tu cuenta en el S.I.I fue reactivada con una nueva vigencia:

Acceso habilitado desde: ${fechaLarga(startDate)}
Acceso habilitado hasta: ${fechaLarga(endDate)}

${empiezaDespues
  ? `Podrás iniciar sesión a partir del ${fechaLarga(startDate)}.`
  : 'Ya puedes iniciar sesión con tu contraseña de siempre.'}

Ingresa en: ${loginUrl}`,
    html,
  });
};

// (p48) Confirmación de cambio de contraseña. Es una señal de seguridad: si el
// cambio no lo hizo la persona, este correo es lo que se lo advierte.
export const sendPasswordChanged = async (to, { name }) => {
  const cuando = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });

  const html = layout({
    title: 'Tu contraseña fue cambiada',
    preview: 'La contraseña de tu cuenta en el S.I.I se actualizó correctamente.',
    body: [
      p(`Hola ${name}, la contraseña de tu cuenta en el S.I.I se cambió correctamente.`),
      dataBox([{ label: 'Fecha del cambio', value: cuando }]),
      notice(
        'Si <strong>no fuiste tú</strong> quien hizo este cambio, comunícate de inmediato con el ' +
        'administrador del sistema: tu cuenta puede estar comprometida.',
      ),
      small('No necesitas hacer nada más si el cambio fue tuyo.'),
    ].join(''),
  });

  await send({
    to,
    subject: 'Tu contraseña fue cambiada — S.I.I',
    text: `Hola ${name},

La contraseña de tu cuenta en el S.I.I se cambió correctamente el ${cuando}.

Si NO fuiste tú quien hizo este cambio, comunícate de inmediato con el administrador
del sistema: tu cuenta puede estar comprometida.`,
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

// Solicitud de firma electrónica de un préstamo.
//
// Sigue la misma estructura que los otros dos correos del sistema: saludo con el
// nombre de quien recibe, el dato accionable destacado, un bloque de datos, el
// botón de acción, el aviso de vencimiento y la nota de seguridad al pie.
// `partyLabel` es el rol de quien firma; `counterpartName`, con quién queda el
// préstamo — sin eso el correo pedía una firma sin decir frente a quién.
export const sendLoanSignatureRequest = async (
  to,
  { partyLabel, signerName, counterpartLabel, counterpartName, loan, signUrl },
) => {
  const lines = loan.materials
    .map((m) => `- ${m.consumableMaterial.materialName} x${m.borrowedQuantity}`)
    .join('\n');
  const items = loan.materials.map(
    (m) => `${m.consumableMaterial.materialName} <strong>x${m.borrowedQuantity}</strong>`,
  );
  const returnDate = loan.returnDate.toISOString().slice(0, 10);
  const loanDate = (loan.loanDate ?? new Date()).toISOString().slice(0, 10);
  const rol = partyLabel.toLowerCase();

  const datos = [
    { label: 'Fecha del préstamo', value: loanDate },
    { label: 'Fecha de devolución', value: returnDate },
    // (p48) El grupo de aprendices pasó a ser opcional: si no lo tiene, la fila no
    // se dibuja. Dejarla mostraría "null" en el correo.
    ...(loan.apprenticeGroup ? [{ label: 'Grupo de aprendices', value: loan.apprenticeGroup }] : []),
    // (p48) El tipo distingue un préstamo para uso interno de uno que sale del centro
    ...(loan.loanType ? [{ label: 'Tipo de préstamo', value: loan.loanType }] : []),
    { label: 'Justificación de uso', value: loan.useJustification },
  ];
  if (counterpartName) {
    datos.unshift({ label: counterpartLabel ?? 'Otra parte', value: counterpartName });
  }

  const html = layout({
    title: `Firma requerida — Préstamo #${loan.id}`,
    preview: `Tienes un préstamo pendiente de firma como ${rol}.`,
    body: [
      p(`${signerName ? `Hola <strong>${signerName}</strong>. ` : ''}Tienes un préstamo pendiente de firma en calidad de <strong>${rol}</strong>. El préstamo solo queda activo cuando ambas partes lo firman.`),
      subtitle('Materiales'),
      list(items),
      subtitle('Datos del préstamo'),
      dataBox(datos),
      button(signUrl, 'Firmar préstamo'),
      notice('El enlace de firma vence en <strong>7 días</strong> y solo puede usarse una vez.'),
      small('Si no reconoces este préstamo, no firmes: comunícate con el administrador del sistema.'),
    ].join(''),
  });

  await send({
    to,
    subject: `Firma requerida — Préstamo #${loan.id} — S.I.I`,
    text: `${signerName ? `Hola ${signerName}.\n\n` : ''}Tienes un préstamo pendiente de firma como ${rol}. El préstamo solo queda activo cuando ambas partes lo firman.

Materiales:
${lines}
${counterpartName ? `\n${counterpartLabel ?? 'Otra parte'}: ${counterpartName}` : ''}
Fecha del préstamo: ${loanDate}
Fecha de devolución: ${returnDate}${loan.apprenticeGroup ? `
Grupo de aprendices: ${loan.apprenticeGroup}` : ''}${loan.loanType ? `
Tipo de préstamo: ${loan.loanType}` : ''}
Justificación: ${loan.useJustification}

Firma aquí (el enlace vence en 7 días): ${signUrl}

Si no reconoces este préstamo, no firmes: comunícate con el administrador del sistema.`,
    html,
  });
};
