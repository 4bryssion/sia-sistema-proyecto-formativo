import { accessService } from '../features/access/access.service.js';

// Middleware de autorización por codename de permiso.
// Requiere authenticateToken antes en la cadena (para tener req.user.id disponible).
// En este prompt NO se aplica a rutas de negocio — solo se deja creado y exportado.
export const requirePermission = (permissionCode) => async (req, res, next) => {
  try {
    const granted = await accessService.hasPermission(req.user.id, permissionCode);
    if (!granted) {
      return res.status(403).json({ error: 'No tiene permisos para realizar esta acción.' });
    }
    next();
  } catch (err) {
    next(err);
  }
};
