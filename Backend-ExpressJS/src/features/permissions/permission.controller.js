import { permissionService } from './permission.service.js';

export const permissionController = {
  async getAll(req, res, next) {
    try {
      const data = await permissionService.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const data = await permissionService.getById(Number(req.params.id));
      res.json(data);
    } catch (err) { next(err); }
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

  async delete(req, res, next) {
    try {
      await permissionService.delete(Number(req.params.id));
      res.json({ mensaje: 'Permiso eliminado.' });
    } catch (err) { next(err); }
  },
};
