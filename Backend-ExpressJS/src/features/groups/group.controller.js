import { groupService } from './group.service.js';

export const groupController = {
  async getAll(req, res, next) {
    try {
      res.json(await groupService.getAll());
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      res.json(await groupService.getById(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await groupService.create(req.body);
      res.status(201).json({ mensaje: 'Grupo creado.', data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await groupService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Grupo actualizado.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await groupService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Grupo activado.' : 'Grupo desactivado.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },

  async assignPermission(req, res, next) {
    try {
      await groupService.assignPermission(Number(req.params.id), req.body.permissionId);
      res.status(201).json({ mensaje: 'Permiso asignado al grupo.' });
    } catch (err) { next(err); }
  },

  async removePermission(req, res, next) {
    try {
      await groupService.removePermission(Number(req.params.id), Number(req.params.permissionId));
      res.json({ mensaje: 'Permiso removido del grupo.' });
    } catch (err) { next(err); }
  },

  async getPermissions(req, res, next) {
    try {
      res.json(await groupService.getPermissions(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async updatePermissions(req, res, next) {
    try {
      await groupService.updatePermissions(Number(req.params.id), req.body.permissionIds);
      res.json({ mensaje: 'Permisos del grupo actualizados.' });
    } catch (err) { next(err); }
  },
};
