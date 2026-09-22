import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller.js';
import { validate, loginSchema, forgotPasswordSchema, verifyResetCodeSchema, resetPasswordSchema, changePasswordSchema } from './auth.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// IMPORTANTE: dos instancias separadas, NO una compartida entre las dos rutas.
// express-rate-limit lleva el contador por IP dentro de la instancia; si `forgot-password` y
// `verify-reset-code` compartieran la misma instancia, un flujo legítimo (pedir código = 1,
// equivocarse 2 veces, reenviar código = 1, verificar = 1) agotaría un límite total de 5 y
// bloquearía al usuario real, no a un atacante.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5, // pedir códigos es lo que hay que limitar duro (evita spam de correos)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10, // más laxo: el anti-fuerza-bruta real ya lo da `attempts` (5 por código, ver §5)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/logout
// authenticateToken verifica que el token sea válido antes de confirmar el logout.
// La invalidación real es client-side (descartar el token en el frontend).
router.post('/logout', authenticateToken, authController.logout);

// (p48) Limitador propio del cambio de contraseña: el endpoint recibe la
// contraseña ACTUAL, así que sin límite sería un oráculo para adivinarla a fuerza
// bruta desde una sesión robada. Se cuenta por IP, igual que los otros dos.
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

// (p49) POST /api/auth/heartbeat — el navegador avisa de que sigue abierto.
// POST /api/auth/session-ending — el navegador avisa de que se está cerrando.
// Las dos pasan por authenticateToken (que ya comprueba el jti) y NO llevan
// limitador: el latido es periódico por diseño y un limitador por IP echaría a
// varios usuarios detrás de la misma salida a internet, que es el caso normal en
// el centro de formación.
router.post('/heartbeat', authenticateToken, authController.heartbeat);
router.post('/session-ending', authenticateToken, authController.sessionEnding);

// POST /api/auth/change-password — contraseña actual + nueva, con sesión iniciada.
// Es una de las DOS rutas que authenticateToken deja pasar cuando el usuario
// todavía tiene la contraseña temporal (la otra es logout): si las bloqueara,
// no habría forma de salir de ese estado.
router.post('/change-password', authenticateToken, changePasswordLimiter, validate(changePasswordSchema), authController.changePassword);

// POST /api/auth/forgot-password — envía código de 6 dígitos al correo
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/verify-reset-code — valida el código y emite un resetTicket JWT de 5 min
router.post('/verify-reset-code', verifyCodeLimiter, validate(verifyResetCodeSchema), authController.verifyResetCode);

// POST /api/auth/reset-password — usa el resetTicket para establecer la nueva contraseña
// No lleva limiter: el resetTicket firmado ya no es adivinable por fuerza bruta
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Handler local: intercepta los errores con statusCode propio de authService
// (401 credenciales, 409 sesión ya iniciada) antes del handler global, que
// respondería 400 para todos. Los errores de Prisma u otros sin statusCode
// pasan al handler global con next(err).
router.use((err, req, res, next) => {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  next(err);
});

export default router;
