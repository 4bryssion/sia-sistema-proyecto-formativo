import { brandService } from './brand.service.js';

export const brandController = {
  async getAll(req, res, next) {
    try { res.json(await brandService.getAll()); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await brandService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await brandService.create(req.body);
      res.status(201).json({ mensaje: 'Marca creada.', data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await brandService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Marca actualizada.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await brandService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Marca activada.' : 'Marca desactivada.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
