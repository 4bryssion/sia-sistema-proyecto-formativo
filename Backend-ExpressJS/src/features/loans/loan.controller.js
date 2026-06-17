import { loanService } from './loan.service.js';

export const loanController = {
  async getAll(req, res, next) {
    try { res.json(await loanService.getAll()); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await loanService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await loanService.create(req.body);
      res.status(201).json({ mensaje: 'Préstamo creado.', data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await loanService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Préstamo actualizado.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await loanService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Préstamo activado.' : 'Préstamo desactivado.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
