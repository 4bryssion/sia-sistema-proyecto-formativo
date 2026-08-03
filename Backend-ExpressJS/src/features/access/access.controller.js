import { accessService } from './access.service.js';

export const accessController = {
  async getGroups(req, res, next) {
    try {
      res.json(await accessService.getUserGroups(Number(req.params.userId)));
    } catch (err) { next(err); }
  },

  async assignGroup(req, res, next) {
    try {
      await accessService.assignGroup(Number(req.params.userId), req.body.groupId);
      res.status(201).json({ mensaje: 'Grupo asignado al usuario.' });
    } catch (err) { next(err); }
  },

  async removeGroup(req, res, next) {
    try {
      await accessService.removeGroup(Number(req.params.userId), Number(req.params.groupId));
      res.json({ mensaje: 'Grupo removido del usuario.' });
    } catch (err) { next(err); }
  },

  async getPermissions(req, res, next) {
    try {
      res.json(await accessService.getUserPermissions(Number(req.params.userId)));
    } catch (err) { next(err); }
  },

  async assignPermission(req, res, next) {
    try {
      await accessService.assignPermission(Number(req.params.userId), req.body.permissionId);
      res.status(201).json({ mensaje: 'Permiso directo asignado al usuario.' });
    } catch (err) { next(err); }
  },

  async removePermission(req, res, next) {
    try {
      await accessService.removePermission(Number(req.params.userId), Number(req.params.permissionId));
      res.json({ mensaje: 'Permiso directo removido del usuario.' });
    } catch (err) { next(err); }
  },

  // Usa req.user.id del token (no un userId de URL) — responde { permissionCode, granted }
  // Permisos efectivos del usuario autenticado (para el Permission Gate del frontend)
  async myPermissions(req, res, next) {
    try {
      const permissions = await accessService.getEffectivePermissions(Number(req.user.id));
      res.json({ permissions });
    } catch (err) { next(err); }
  },

  async checkPermission(req, res, next) {
    try {
      const granted = await accessService.hasPermission(Number(req.user.id), req.params.permissionCode);
      res.json({ permissionCode: req.params.permissionCode, granted });
    } catch (err) { next(err); }
  },
};
