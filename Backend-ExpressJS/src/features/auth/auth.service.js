import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { sendPasswordResetCode } from '../../config/mailer.js';

const authError = (msg) => {
  const err = new Error(msg);
  err.statusCode = 401;
  return err;
};

// Sesión única (p45): 409 Conflict — no es un fallo de credenciales (401), es que
// las credenciales son correctas pero ya hay una sesión abierta en otro lado.
const sessionConflictError = () => {
  const err = new Error(
    'Ya tienes una sesión iniciada en otro navegador o dispositivo. Ciérrala antes de volver a ingresar.',
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

    // Sesión única (p45): las credenciales se validan ANTES de mirar la sesión
    // activa. Si se hiciera al revés, cualquiera podría averiguar quién tiene
    // sesión abierta probando correos con contraseñas falsas.
    if (hasLiveSession(user)) throw sessionConflictError();

    // jti: identificador único de este token. Se guarda en la BD para poder
    // invalidar la sesión sin blacklist (el token que no coincida deja de servir).
    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { id: user.id, email: user.userEmail, jti },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES },
    );

    // La caducidad de la sesión se toma del propio token (campo exp), no de un
    // cálculo aparte: así nunca se desincronizan si cambia JWT_EXPIRES.
    const { exp } = jwt.decode(token);
    await authRepository.setActiveSession(user.id, jti, new Date(exp * 1000));

    return {
      token,
      user: { id: user.id, email: user.userEmail },
    };
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
