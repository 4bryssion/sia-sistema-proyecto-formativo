import { userService } from './user.service.js';

export const userController = {
  async getAll(req, res, next) {
    try {
      res.json(await userService.getAll(req.query.status));
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      res.json(await userService.getById(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { user, emailSent, emailError } = await userService.create(req.body, req.file);
      // emailSent/emailError permiten al frontend distinguir: creado + credenciales
      // enviadas vs creado pero correo fallido (invalid_recipient | service_error)
      res.status(201).json({ mensaje: 'Usuario creado.', data: user, emailSent, emailError });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await userService.update(Number(req.params.id), req.body, req.file);
      res.json({ mensaje: 'Usuario actualizado.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await userService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Usuario activado.' : 'Usuario desactivado.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
