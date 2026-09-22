import { authService } from './auth.service.js';

export const authController = {
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ mensaje: 'Login exitoso.', ...result });
    } catch (err) { next(err); }
  },

  // Con sesión única (p45) el logout ya NO es solo client-side: libera el jti
  // activo del usuario. Sin esto, cerrar sesión dejaría la cuenta bloqueada
  // hasta que venciera el token.
  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      res.json({ mensaje: 'Logout exitoso.' });
    } catch (err) { next(err); }
  },

  // (p49) Latido de sesión. Responde 204 porque no tiene nada que devolver y se
  // llama cada pocos segundos: cuanto menos viaje, mejor.
  async heartbeat(req, res, next) {
    try {
      await authService.heartbeat(req.user.id);
      res.status(204).end();
    } catch (err) { next(err); }
  },

  // (p49) Aviso de que la pestaña se cierra. Lo manda `fetch(..., keepalive)`
  // desde `pagehide`, que el navegador despacha aunque la página ya se esté yendo.
  async sessionEnding(req, res, next) {
    try {
      await authService.sessionEnding(req.user.id);
      res.status(204).end();
    } catch (err) { next(err); }
  },

  // (p48) Sirve a los dos casos: "Mi perfil → Cambiar contraseña" y el cambio
  // obligatorio del primer inicio de sesión.
  async changePassword(req, res, next) {
    try {
      await authService.changePassword(req.user.id, req.body);
      res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
    } catch (err) { next(err); }
  },

  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.body.email); // no espera el envío de correo (fire-and-forget, ver §5) — esto solo cubre errores de BD
    } catch (err) {
      console.error('Error generando código de recuperación:', err.message); // no se filtra al cliente
    }
    // Siempre 200 con el mismo mensaje — anti-enumeración (decisión 5).
    res.status(200).json({ mensaje: 'Si el correo está registrado, se envió un código de recuperación.' });
  },

  async verifyResetCode(req, res, next) {
    try {
      const { resetTicket } = await authService.verifyResetCode(req.body);
      res.status(200).json({ mensaje: 'Código verificado.', resetTicket });
    } catch (err) { next(err); }
  },

  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.body);
      res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
    } catch (err) { next(err); }
  },
};
