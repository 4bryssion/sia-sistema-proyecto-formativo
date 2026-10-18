import { taskService } from './task.service.js';

export const taskController = {
  async getAll(req, res, next) {
    try { res.json(await taskService.getAll(req.query.status, req.user.id)); }
    catch (err) { next(err); }
  },

  async getByUser(req, res, next) {
    // (p51) El actor va aparte del dueño del listado: un administrador puede
    // consultar las tareas de otra persona, y `miAsignacion` tiene que seguir
    // siendo la de quien pregunta, no la de aquel a quien consulta.
    try { res.json(await taskService.getByUser(Number(req.params.userId), req.user.id)); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await taskService.getById(Number(req.params.id), req.user.id)); }
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
      const data = await taskService.update(Number(req.params.id), req.body, req.user.id);
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
        // (p51) De quién es el estado que se cambia. Ausente = el propio.
        req.body?.userId,
      );
      res.json({ mensaje: 'Estado de la tarea actualizado.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await taskService.toggle(Number(req.params.id), req.user.id);
      const mensaje = data.isActive ? 'Tarea activada.' : 'Tarea desactivada.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
