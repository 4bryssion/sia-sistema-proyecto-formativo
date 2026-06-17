import { permissionService } from './permission.service.js';

export const permissionController = {
  async getAll(req, res, next) {
    try { res.json(await permissionService.getAll()); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await permissionService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await permissionService.create(req.body);
      res.status(201).json({ mensaje: 'Permiso creado.', data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await permissionService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Permiso actualizado.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await permissionService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Permiso activado.' : 'Permiso desactivado.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
