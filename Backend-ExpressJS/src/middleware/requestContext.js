import { AsyncLocalStorage } from 'node:async_hooks';
import jwt from 'jsonwebtoken';

// Contexto por petición: guarda QUIÉN está ejecutando la acción para que las
// notificaciones (notify) puedan registrar al autor sin tener que propagar
// req.user por todas las firmas de controllers → services → repositories.
export const requestContext = new AsyncLocalStorage();

export const getActorId = () => requestContext.getStore()?.userId ?? null;

// Se registra globalmente en app.js. No bloquea nada: si no hay token o es
// inválido, simplemente no hay autor (las rutas públicas siguen funcionando).
export const requestContextMiddleware = (req, res, next) => {
  let userId = null;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      userId = jwt.verify(auth.slice(7), process.env.JWT_SECRET)?.id ?? null;
    } catch {
      userId = null;
    }
  }
  requestContext.run({ userId }, () => next());
};
