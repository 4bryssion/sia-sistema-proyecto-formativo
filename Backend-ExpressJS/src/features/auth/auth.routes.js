import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate, loginSchema } from './auth.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/logout
// authenticateToken verifica que el token sea válido antes de confirmar el logout.
// La invalidación real es client-side (descartar el token en el frontend).
router.post('/logout', authenticateToken, authController.logout);

// Handler local: intercepta errores 401 de authService antes del handler global.
// Errores de Prisma u otros sin statusCode 401 pasan al handler global con next(err).
router.use((err, req, res, next) => {
  if (err.statusCode === 401) {
    return res.status(401).json({ error: err.message });
  }
  next(err);
});

export default router;
