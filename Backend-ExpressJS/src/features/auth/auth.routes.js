import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller.js';
import { validate, loginSchema, forgotPasswordSchema, verifyResetCodeSchema, resetPasswordSchema } from './auth.validator.js';
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

// POST /api/auth/forgot-password — envía código de 6 dígitos al correo
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/verify-reset-code — valida el código y emite un resetTicket JWT de 5 min
router.post('/verify-reset-code', verifyCodeLimiter, validate(verifyResetCodeSchema), authController.verifyResetCode);

// POST /api/auth/reset-password — usa el resetTicket para establecer la nueva contraseña
// No lleva limiter: el resetTicket firmado ya no es adivinable por fuerza bruta
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Handler local: intercepta errores 401 de authService antes del handler global.
// Errores de Prisma u otros sin statusCode 401 pasan al handler global con next(err).
router.use((err, req, res, next) => {
  if (err.statusCode === 401) {
    return res.status(401).json({ error: err.message });
  }
  next(err);
});

export default router;
