import { devolutionService } from './devolution.service.js';

export const devolutionController = {
  async getAll(req, res, next) {
    try {
      const { status = 'active' } = req.query;
      res.json(await devolutionService.getAll(status));
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await devolutionService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      // Quien entrega es el usuario autenticado, no un id del body: si viniera
      // del cliente se podría registrar una devolución a nombre de otro
      const data = await devolutionService.create(req.body, req.user.id);
      res.status(201).json({ mensaje: 'Devolución registrada.', data });
    } catch (err) { next(err); }
  },

  async authorize(req, res, next) {
    try {
      const data = await devolutionService.authorize(Number(req.params.id), req.body, req.user.id);
      res.json({ mensaje: 'Devolución autorizada.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await devolutionService.toggle(Number(req.params.id));
      res.json({ mensaje: data.isActive ? 'Devolución reactivada.' : 'Devolución descartada.', data });
    } catch (err) { next(err); }
  },
};
