import { authService } from './auth.service.js';

export const authController = {
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ mensaje: 'Login exitoso.', ...result });
    } catch (err) { next(err); }
  },

  // El logout con JWT es client-side (el cliente descarta el token).
  // Este endpoint confirma el logout al frontend y está estructurado
  // para cuando se implemente una blacklist de tokens en el futuro.
  async logout(req, res, next) {
    try {
      res.json({ mensaje: 'Logout exitoso.' });
    } catch (err) { next(err); }
  },
};
