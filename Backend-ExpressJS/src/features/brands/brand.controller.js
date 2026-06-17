import { brandService } from './brand.service.js';

export const brandController = {
  async getAll(req, res, next) {
    try {
      const data = await brandService.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try {
      const data = await brandService.getById(Number(req.params.id));
      res.json(data);
    } catch (err) { next(err); }
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
  async delete(req, res, next) {
    try {
      await brandService.delete(Number(req.params.id));
      res.json({ mensaje: 'Marca eliminada.' });
    } catch (err) { next(err); }
  },
};
