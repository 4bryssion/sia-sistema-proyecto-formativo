import { loanReturnService } from './loanReturn.service.js';

export const loanReturnController = {
  async getAll(req, res, next) {
    try { res.json(await loanReturnService.getAll()); }
    catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try { res.json(await loanReturnService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const data = await loanReturnService.create(req.body);
      res.status(201).json({ mensaje: 'Retorno registrado.', data });
    } catch (err) { next(err); }
  },
  async delete(req, res, next) {
    try {
      await loanReturnService.delete(Number(req.params.id));
      res.json({ mensaje: 'Retorno eliminado.' });
    } catch (err) { next(err); }
  },
};
