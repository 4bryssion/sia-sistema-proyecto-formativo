import { taskService } from './task.service.js';

export const taskController = {
  async getAll(req, res, next) {
    try { res.json(await taskService.getAll()); }
    catch (err) { next(err); }
  },

  async getByUser(req, res, next) {
    try { res.json(await taskService.getByUser(Number(req.params.userId))); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await taskService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await taskService.create(req.body);
      res.status(201).json({ mensaje: 'Tarea creada.', data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await taskService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Tarea actualizada.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await taskService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Tarea activada.' : 'Tarea desactivada.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
