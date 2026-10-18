import { accessService } from '../features/access/access.service.js';

// Middleware de autorización por codename de permiso.
// Requiere authenticateToken antes en la cadena (para tener req.user.id disponible).
//
// (p51) Acepta un codename o una LISTA, y con lista basta tener uno —la misma
// semántica O que `can()` en el frontend, para que las dos capas no digan cosas
// distintas con la misma forma—. Lo pide `GET /users`, que sirve a dos casos
// legítimos: ver la tabla de usuarios (`list_users`) y llenar un desplegable
// (`select_users`). Sin esto habría que escribir un middleware a mano por cada
// ruta con dos puertas, que es como se cuelan los descuidos.
export const requirePermission = (permissionCode) => async (req, res, next) => {
  try {
    const codenames = Array.isArray(permissionCode) ? permissionCode : [permissionCode];
    for (const codename of codenames) {
      if (await accessService.hasPermission(req.user.id, codename)) return next();
    }
    return res.status(403).json({ error: 'No tiene permisos para realizar esta acción.' });
  } catch (err) {
    next(err);
  }
};
