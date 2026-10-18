import { loanReturnService } from './loanReturn.service.js';

export const loanReturnController = {
  async getAll(req, res, next) {
    try { res.json(await loanReturnService.getAll(req.user)); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await loanReturnService.getById(Number(req.params.id), req.user)); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await loanReturnService.create(req.body, req.user);
      res.status(201).json({ mensaje: 'Retorno registrado.', data });
    } catch (err) { next(err); }
  },

  // (p52) Era un interruptor y ahora solo apaga: la ruta sigue siendo la misma
  // para no romper a nadie que ya la llame.
  async toggle(req, res, next) {
    try {
      const data = await loanReturnService.desactivar(Number(req.params.id), req.user);
      res.json({ mensaje: 'Retorno desactivado.', data });
    } catch (err) { next(err); }
  },
};
