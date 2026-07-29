// Plantillas HTML de los correos del S.I.I.
//
// Por qué maquetación con <table> y estilos en línea: los clientes de correo
// (Gmail, Outlook, Apple Mail) descartan <style>, flexbox y grid. El HTML de correo
// se escribe como en 2005 a propósito — no es deuda técnica.
//
// Los colores son los tokens del proyecto escritos literalmente: en un correo no
// existen las variables CSS del frontend, así que se replican aquí a mano. Si se
// cambia la paleta en tokens.css, hay que reflejarlo en COLORS.

const COLORS = {
  primary: '#39A900',      // --color-primary-950 (verde SENA)
  primaryDark: '#007832',  // --sia-color-secondary-950
  accent: '#50E5F9',       // --color-cuaternario-950
  surface: '#FFFFFF',
  background: '#E9E9E9',   // --color-gray-900
  text: '#000000',
  textSoft: '#565656',     // --color-gray-300
  border: '#D1D1D1',       // --color-gray-800
  warningBg: '#FFF4D0',    // --color-tertiary-200
  warningText: '#5A4600',
};

const FONT = "'Work Sans', 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Envoltura común de todos los correos: banda de cabecera con el gradiente de la
 * app, tarjeta blanca con el contenido y pie institucional.
 *
 * @param {object} p
 * @param {string} p.title    Título grande dentro de la tarjeta (jerarquía 1)
 * @param {string} p.preview  Texto de vista previa (lo que muestra la bandeja antes de abrir)
 * @param {string} p.body     HTML del cuerpo
 */
export const layout = ({ title, preview, body }) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.background};">
  <!-- Preheader: se muestra en la lista de la bandeja, oculto al abrir -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.background};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.surface};border-radius:12px;overflow:hidden;border:1px solid ${COLORS.border};">

          <!-- Cabecera institucional -->
          <tr>
            <td style="background:${COLORS.primary};background-image:linear-gradient(to right, ${COLORS.primary} 63%, ${COLORS.primaryDark} 100%);padding:20px 28px;">
              <p style="margin:0;font-family:${FONT};font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:1px;">S.I.I</p>
              <p style="margin:4px 0 0;font-family:${FONT};font-size:13px;color:#EAFBE2;">Software de Inventario de Infraestructura</p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px;font-family:${FONT};font-size:20px;line-height:1.3;color:${COLORS.text};font-weight:700;">${title}</h1>
              ${body}
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid ${COLORS.border};">
              <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.6;color:${COLORS.textSoft};">
                Este es un mensaje automático del S.I.I — Software de Inventario de Infraestructura. Por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/** Párrafo estándar del cuerpo */
export const p = (html) =>
  `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${COLORS.text};">${html}</p>`;

/** Texto secundario, menor jerarquía */
export const small = (html) =>
  `<p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:1.6;color:${COLORS.textSoft};">${html}</p>`;

/** Caja destacada para el dato protagonista (código de recuperación) */
export const codeBox = (code) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
    <tr>
      <td align="center" style="background:${COLORS.background};border:2px dashed ${COLORS.primary};border-radius:12px;padding:18px;">
        <p style="margin:0;font-family:${FONT};font-size:32px;font-weight:700;letter-spacing:8px;color:${COLORS.primaryDark};">${code}</p>
      </td>
    </tr>
  </table>`;

/** Bloque etiqueta/valor para datos (credenciales, detalles del préstamo) */
export const dataBox = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;background:${COLORS.background};border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      ${rows
        .map(
          ({ label, value }) => `
        <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${COLORS.textSoft};">${label}</p>
        <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;font-weight:700;color:${COLORS.text};word-break:break-all;">${value}</p>`,
        )
        .join('')}
    </td></tr>
  </table>`;

/** Aviso destacado (contraseña temporal, vencimiento) */
export const notice = (html) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
    <tr>
      <td style="background:${COLORS.warningBg};border-left:4px solid ${COLORS.primary};border-radius:6px;padding:12px 16px;">
        <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;color:${COLORS.warningText};">${html}</p>
      </td>
    </tr>
  </table>`;

/** Lista numerada de pasos (paso a paso para cambiar la contraseña) */
export const steps = (items) => `
  <ol style="margin:0 0 18px;padding-left:20px;font-family:${FONT};font-size:14px;line-height:1.8;color:${COLORS.text};">
    ${items.map((i) => `<li style="margin-bottom:4px;">${i}</li>`).join('')}
  </ol>`;

/** Lista simple (materiales del préstamo) */
export const list = (items) => `
  <ul style="margin:0 0 18px;padding-left:20px;font-family:${FONT};font-size:14px;line-height:1.8;color:${COLORS.text};">
    ${items.map((i) => `<li>${i}</li>`).join('')}
  </ul>`;

/** Botón de acción (bulletproof: se ve igual en Outlook) */
export const button = (href, text) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;">
    <tr>
      <td align="center" style="background:${COLORS.primary};border-radius:24px;">
        <a href="${href}" style="display:inline-block;padding:12px 32px;font-family:${FONT};font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;

/** Título de sección dentro del cuerpo (jerarquía 2) */
export const subtitle = (text) =>
  `<p style="margin:20px 0 10px;font-family:${FONT};font-size:15px;font-weight:700;color:${COLORS.primaryDark};">${text}</p>`;

export { COLORS, FONT };
