import { returnableMaterialService } from './returnableMaterial.service.js';

export const returnableMaterialController = {
  async getAll(req, res, next) {
    try { res.json(await returnableMaterialService.getAll()); }
    catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try { res.json(await returnableMaterialService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const data = await returnableMaterialService.create(req.body, req.files);
      res.status(201).json({ mensaje: 'Material devolutivo creado.', data });
    } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try {
      const data = await returnableMaterialService.update(Number(req.params.id), req.body, req.files);
      res.json({ mensaje: 'Material devolutivo actualizado.', data });
    } catch (err) { next(err); }
  },
  async delete(req, res, next) {
    try {
      await returnableMaterialService.delete(Number(req.params.id));
      res.json({ mensaje: 'Material devolutivo eliminado.' });
    } catch (err) { next(err); }
  },
};
