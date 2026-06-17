import { consumableMaterialService } from './consumableMaterial.service.js';

export const consumableMaterialController = {
  async getAll(req, res, next) {
    try { res.json(await consumableMaterialService.getAll()); }
    catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try { res.json(await consumableMaterialService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const data = await consumableMaterialService.create(req.body, req.file);
      res.status(201).json({ mensaje: 'Material de consumo creado.', data });
    } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try {
      const data = await consumableMaterialService.update(Number(req.params.id), req.body, req.file);
      res.json({ mensaje: 'Material de consumo actualizado.', data });
    } catch (err) { next(err); }
  },
  async delete(req, res, next) {
    try {
      await consumableMaterialService.delete(Number(req.params.id));
      res.json({ mensaje: 'Material de consumo eliminado.' });
    } catch (err) { next(err); }
  },
};
