import { taskService } from './task.service.js';

export const taskController = {
  async getAll(req, res, next) {
    try { res.json(await taskService.getAll(req.query.status)); }
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

  // (p50) Cambiar SOLO el estado. `puedeEditarTodas` lo resuelve la ruta.
  async setStatus(req, res, next) {
    try {
      const data = await taskService.setStatus(
        Number(req.params.id),
        Number(req.user.id),
        req.body?.status,
        req.puedeEditarTareas === true,
      );
      res.json({ mensaje: 'Estado de la tarea actualizado.', data });
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
