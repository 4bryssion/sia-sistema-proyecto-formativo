import { userService } from './user.service.js';

export const userController = {
  async getAll(req, res, next) {
    try {
      res.json(await userService.getAll());
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      res.json(await userService.getById(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await userService.create(req.body, req.file);
      res.status(201).json({ mensaje: 'Usuario creado.', data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await userService.update(Number(req.params.id), req.body, req.file);
      res.json({ mensaje: 'Usuario actualizado.', data });
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await userService.delete(Number(req.params.id));
      res.json({ mensaje: 'Usuario eliminado.' });
    } catch (err) { next(err); }
  },
};
