import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { sendPasswordResetCode, sendPasswordChanged } from '../../config/mailer.js';
import { VENTANA_SESION_MS, GRACIA_CIERRE_MS } from '../../config/session.js';

const authError = (msg) => {
  const err = new Error(msg);
  err.statusCode = 401;
  return err;
};

// Sesión única (p45): 409 Conflict — no es un fallo de credenciales (401), es que
// las credenciales son correctas pero ya hay una sesión abierta en otro lado.
//
// (p50) El texto decía "en otro navegador o dispositivo", y eso no siempre es
// cierto: la sesión vive en localStorage, que comparten TODAS las ventanas y
// pestañas del mismo navegador. El caso más frecuente es justamente ese —otra
// ventana del mismo Chrome—, y mandar a alguien a buscar en otro equipo una
// sesión que tiene a un alt-tab de distancia es peor que no decir nada.
//
// La segunda frase importa igual que la primera: si ya cerró esa ventana, la
// sesión se libera sola en unos segundos (GRACIA_CIERRE_MS, config/session.js),
// así que la respuesta correcta es esperar y reintentar, no darse por bloqueado.
const sessionConflictError = () => {
  const err = new Error(
    'Ya tienes una sesión abierta: puede ser otra ventana de este mismo navegador, '
    + 'otro navegador u otro equipo. Ciérrala desde ahí. Si ya la cerraste, espera '
    + 'unos segundos y vuelve a intentarlo.',
  );
  err.statusCode = 409;
  return err;
};

// Una sesión cuenta como viva solo si hay jti Y todavía no venció. La caducidad
// es lo que impide dejar la cuenta bloqueada cuando alguien cierra el navegador
// sin hacer logout: pasado el vencimiento del token, la sesión se libera sola.
const hasLiveSession = (user) =>
  Boolean(user.activeSessionJti) &&
  Boolean(user.activeSessionExpiresAt) &&
  user.activeSessionExpiresAt > new Date();

// (p48) Vigencia del vínculo. Se comparan fechas de CALENDARIO como texto
// 'YYYY-MM-DD': new Date('YYYY-MM-DD') parsea en UTC y en UTC-5 desplaza el día
// (es el bug transversal que ya se corrigió en el resto del proyecto).
const hoyISO = () => new Date().toLocaleDateString('en-CA');
const aISO = (fecha) => new Date(fecha).toLocaleDateString('en-CA', { timeZone: 'UTC' });
const enLetras = (fecha) =>
  new Date(fecha).toLocaleDateString('es-CO', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  });

const RESET_CODE_TTL_MIN = 15;
const RESET_TICKET_TTL = '5m';
const MAX_ATTEMPTS = 5;

const genericCodeError = () => new Error('Código inválido o expirado.');

export const authService = {
  async login({ email, password }) {
    const user = await authRepository.findByEmail(email);

    if (!user) throw authError('Credenciales inválidas');

    const isMatch = await bcrypt.compare(password, user.userPassword);
    if (!isMatch) throw authError('Credenciales inválidas');

    if (!user.isActive) throw authError('Usuario inactivo');

    // (p48) Vigencia del vínculo, DESPUÉS de las credenciales por el mismo motivo
    // que la sesión única: si se comprobara antes, cualquiera podría averiguar la
    // vigencia de una cuenta ajena probando correos con contraseñas falsas.
    //
    // El vencimiento se revisa aquí además de en la tarea programada diaria: la
    // tarea no corre si el servidor estuvo apagado esa noche, y sin esta segunda
    // comprobación un vínculo vencido seguiría dejando entrar hasta la siguiente.
    if (aISO(user.userEndDate) < hoyISO()) {
      // Se desactiva en el momento para que el listado refleje la realidad y no
      // haga falta esperar a la próxima ejecución de la tarea
      await authRepository.deactivateExpiredUser(user.id);
      throw authError(`Tu vínculo finalizó el ${enLetras(user.userEndDate)}. Comunícate con el administrador.`);
    }

    if (aISO(user.userStartDate) > hoyISO()) {
      throw authError(`Tu cuenta estará habilitada a partir del ${enLetras(user.userStartDate)}.`);
    }

    // Sesión única (p45): las credenciales se validan ANTES de mirar la sesión
    // activa. Si se hiciera al revés, cualquiera podría averiguar quién tiene
    // sesión abierta probando correos con contraseñas falsas.
    //
    // (p49) Este 409 ya no puede dejar a nadie fuera de su propia cuenta: la
    // sesión solo sigue viva mientras el navegador late (ver config/session.js).
    // Si el 409 aparece, es porque hay una sesión REAL abierta ahora mismo en
    // otro sitio — que es justo lo que la sesión única quiere impedir.
    if (hasLiveSession(user)) throw sessionConflictError();

    // jti: identificador único de este token. Se guarda en la BD para poder
    // invalidar la sesión sin blacklist (el token que no coincida deja de servir).
    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { id: user.id, email: user.userEmail, jti },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES },
    );

    // (p49) La sesión vence por la ventana de latido, NO por la caducidad del
    // token. El `exp` del JWT sigue siendo el tope absoluto —nunca se pasa de
    // ahí—, pero la ventana es lo que hace que una sesión huérfana (navegador
    // cerrado, equipo apagado) se libere sola en minutos en vez de en horas.
    const { exp } = jwt.decode(token);
    const vence = new Date(Math.min(Date.now() + VENTANA_SESION_MS, exp * 1000));
    await authRepository.setActiveSession(user.id, jti, vence);

    return {
      token,
      user: { id: user.id, email: user.userEmail },
      // (p48) El frontend lo usa para redirigir de forma obligatoria a cambiar la
      // contraseña. No es la barrera de seguridad — esa es authenticateToken, que
      // cierra el paso al resto del API — sino la señal para la interfaz.
      mustChangePassword: user.mustChangePassword,
    };
  },

  // (p48) Cambio de contraseña desde "Mi perfil" y desde el primer inicio forzado.
  // Es el mismo endpoint para los dos casos: en ambos la persona está autenticada
  // y debe demostrar que conoce la contraseña actual.
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await authRepository.findCredentialsById(userId);
    if (!user || !user.isActive) throw authError('La cuenta no está activa.');

    const coincide = await bcrypt.compare(currentPassword, user.userPassword);
    // 401 y no 400: es un fallo de credenciales, y el limitador de la ruta es lo
    // que evita que se use para adivinar la contraseña actual a fuerza bruta.
    if (!coincide) throw authError('La contraseña actual no es correcta.');

    // Comparar los hashes no serviría: bcrypt usa una sal distinta cada vez, así
    // que la misma contraseña produce hashes diferentes.
    const esLaMisma = await bcrypt.compare(newPassword, user.userPassword);
    if (esLaMisma) throw new Error('La nueva contraseña debe ser distinta de la actual.');

    const hashed = await bcrypt.hash(newPassword, 10); // mismo SALT_ROUNDS que user.service.js
    await authRepository.changePassword(userId, hashed);

    // Fire-and-forget: el cambio ya quedó guardado y un fallo del correo no debe
    // deshacerlo ni devolver un error al usuario, que hizo todo bien.
    sendPasswordChanged(user.userEmail, {
      name: `${user.userFirstName} ${user.userLastName}`,
    }).catch((err) => console.error('Error enviando aviso de cambio de contraseña:', err.message));
  },

  // (p49) Latido: el navegador avisa de que sigue vivo y la sesión se renueva.
  // Solo llega hasta aquí quien pasó authenticateToken, así que el jti ya quedó
  // comprobado contra el de la sesión activa: nadie puede mantener viva una
  // sesión que no es la suya.
  async heartbeat(userId) {
    await authRepository.touchActiveSession(userId, new Date(Date.now() + VENTANA_SESION_MS));
  },

  // (p49) La pestaña se está cerrando. No se cierra la sesión de golpe porque el
  // navegador avisa igual al RECARGAR: se recorta la ventana a unos segundos. Si
  // era una recarga, la página vuelve y late antes de que venza; si era un cierre
  // de verdad, no vuelve nadie y la sesión queda libre enseguida.
  async sessionEnding(userId) {
    await authRepository.touchActiveSession(userId, new Date(Date.now() + GRACIA_CIERRE_MS));
  },

  // Cierra la sesión activa del usuario: el token que tenga ese jti deja de ser
  // aceptado por authenticateToken de inmediato.
  async logout(userId) {
    await authRepository.clearActiveSession(userId);
  },

  async forgotPassword(email) {
    const user = await authRepository.findByEmail(email);
    // Silencioso a propósito: el controller SIEMPRE responde 200 igual, exista o no el usuario.
    if (!user || !user.isActive) return;

    await authRepository.invalidateActiveCodes(user.id);

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MIN * 60_000);

    await authRepository.createResetCode(user.id, codeHash, expiresAt);

    // Sin `await`: si se esperara el envío SMTP (~1-2s), un correo existente tardaría notablemente
    // más en responder que uno inexistente (que retorna aquí mismo, de inmediato) — eso filtraría
    // por timing lo que el mensaje genérico del controller esconde. Fire-and-forget + log de error.
    sendPasswordResetCode(user.userEmail, code).catch((err) => {
      console.error('Error enviando correo de recuperación:', err.message);
    });
  },

  async verifyResetCode({ email, code }) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw genericCodeError();

    const activeCode = await authRepository.findActiveCodeByUserId(user.id);
    if (!activeCode) throw genericCodeError();

    if (activeCode.attempts >= MAX_ATTEMPTS) {
      await authRepository.markCodeUsed(activeCode.id);
      throw genericCodeError();
    }
    await authRepository.incrementAttempts(activeCode.id);

    const submittedHash = crypto.createHash('sha256').update(code).digest('hex');
    const a = Buffer.from(submittedHash);
    const b = Buffer.from(activeCode.codeHash);
    const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!matches) throw genericCodeError();

    // Verificación exitosa: se bloquea el código para futuras verificaciones (decisión 2 — "una
    // sola verificación exitosa"). NO se marca `used`, porque `used:false` es requisito para que
    // `reset-password` pueda canjear el `resetTicket` que se emite abajo.
    await authRepository.setAttempts(activeCode.id, MAX_ATTEMPTS);

    const resetTicket = jwt.sign(
      { userId: user.id, codeId: activeCode.id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: RESET_TICKET_TTL },
    );
    return { resetTicket };
  },

  async resetPassword({ resetTicket, password }) {
    let payload;
    try {
      payload = jwt.verify(resetTicket, process.env.JWT_SECRET);
    } catch {
      throw new Error('El código de recuperación expiró o no es válido, solicita uno nuevo.');
    }
    if (payload.purpose !== 'password_reset') throw new Error('Ticket de recuperación inválido.');

    const record = await authRepository.findCodeById(payload.codeId);
    // used === true bloquea reutilizar el mismo resetTicket dos veces (defensa en profundidad,
    // no solo confiar en la expiración del JWT).
    if (!record || record.used || record.userId !== payload.userId) {
      throw new Error('El código de recuperación expiró o no es válido, solicita uno nuevo.');
    }

    const hashed = await bcrypt.hash(password, 10); // mismo SALT_ROUNDS que user.service.js
    await authRepository.resetPasswordTransaction(payload.userId, hashed, record.id);
  },
};
