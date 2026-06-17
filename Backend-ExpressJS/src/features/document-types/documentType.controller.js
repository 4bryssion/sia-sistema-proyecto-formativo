import { documentTypeService } from './documentType.service.js';

export const documentTypeController = {
  async getAll(req, res, next) {
    try { res.json(await documentTypeService.getAll()); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await documentTypeService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await documentTypeService.create(req.body);
      res.status(201).json({ mensaje: 'Tipo de documento creado.', data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await documentTypeService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Tipo de documento actualizado.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await documentTypeService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Tipo de documento activado.' : 'Tipo de documento desactivado.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
