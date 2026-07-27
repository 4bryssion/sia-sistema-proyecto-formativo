import { loanService } from './loan.service.js';

export const loanController = {
  async getAll(req, res, next) {
    try {
      const valid = ['active', 'inactive', 'all'];
      const status = valid.includes(req.query.status) ? req.query.status : 'active';
      res.json(await loanService.getAll(status));
    } catch (err) { next(err); }
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

  async toggle(req, res, next) {
    try {
      const data = await loanService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Préstamo activado.' : 'Préstamo desactivado.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await loanService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Préstamo actualizado.', data });
    } catch (err) { next(err); }
  },

  async getSignatureInfo(req, res, next) {
    try { res.json(await loanService.getSignatureInfo(req.query.token)); }
    catch (err) { next(err); }
  },

  async sign(req, res, next) {
    try {
      const loan = await loanService.sign(req.body.token);
      res.json({ mensaje: 'Firma registrada.', status: loan.status });
    } catch (err) { next(err); }
  },

  async resendSignatures(req, res, next) {
    try {
      await loanService.resendSignatures(Number(req.params.id));
      res.json({ mensaje: 'Correos de firma reenviados.' });
    } catch (err) { next(err); }
  },
};
