import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendPasswordResetCode = async (to, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Código de recuperación de contraseña — SIA',
    text: `Tu código de recuperación es: ${code}. Vence en 15 minutos. Si no lo solicitaste, ignora este correo.`,
    html: `<p>Tu código de recuperación es: <strong>${code}</strong></p><p>Vence en 15 minutos. Si no lo solicitaste, ignora este correo.</p>`,
  });
};

// Envío de credenciales de inicio de sesión al crear un usuario (correo personal).
// Se llama ANTES de responder al cliente para poder informar si el envío falló.
export const sendUserCredentials = async (to, { name, email, password }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Tus credenciales de acceso — SIA',
    text: `Hola ${name},\n\nTu cuenta en el SIA fue creada. Estas son tus credenciales de inicio de sesión:\n\nCorreo: ${email}\nContraseña: ${password}\n\nTe recomendamos cambiar la contraseña usando "Recuperar contraseña" en el login.`,
    html: `<p>Hola <strong>${name}</strong>,</p>
      <p>Tu cuenta en el SIA fue creada. Estas son tus credenciales de inicio de sesión:</p>
      <p>Correo: <strong>${email}</strong><br/>Contraseña: <strong>${password}</strong></p>
      <p>Te recomendamos cambiar la contraseña usando "Recuperar contraseña" en el login.</p>`,
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
  const itemsHtml = loan.materials
    .map((m) => `<li>${m.consumableMaterial.materialName} x${m.borrowedQuantity}</li>`)
    .join('');
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Firma requerida — Préstamo #${loan.id} — SIA`,
    text: `Tienes un préstamo pendiente de firma como ${partyLabel}.\n\nMateriales:\n${lines}\n\nGrupo: ${loan.apprenticeGroup}\nJustificación: ${loan.useJustification}\nFecha de devolución: ${loan.returnDate.toISOString().slice(0, 10)}\n\nFirma aquí (vence en 7 días): ${signUrl}`,
    html: `<p>Tienes un préstamo pendiente de firma como <strong>${partyLabel}</strong>.</p>
      <p>Materiales:</p>
      <ul>${itemsHtml}</ul>
      <p>Grupo: ${loan.apprenticeGroup}<br/>Justificación: ${loan.useJustification}<br/>Fecha de devolución: ${loan.returnDate.toISOString().slice(0, 10)}</p>
      <p><a href="${signUrl}">Firmar préstamo</a> (el enlace vence en 7 días)</p>`,
  });
};
