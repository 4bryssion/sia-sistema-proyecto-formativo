-- Sesión única por usuario (p45).
-- active_session_jti: identificador del único token de acceso válido del usuario.
-- active_session_expires_at: caducidad de esa sesión; pasada esa fecha la sesión se
-- considera libre aunque no haya habido logout (evita dejar cuentas bloqueadas
-- cuando el usuario simplemente cierra el navegador).
ALTER TABLE "users" ADD COLUMN "active_session_jti" VARCHAR(64);
ALTER TABLE "users" ADD COLUMN "active_session_expires_at" TIMESTAMP(3);
