import { documentTypeService } from './documentType.service.js';

export const documentTypeController = {
  async getAll(req, res, next) {
    try {
      const data = await documentTypeService.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try {
      const data = await documentTypeService.getById(Number(req.params.id));
      res.json(data);
    } catch (err) { next(err); }
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
  async delete(req, res, next) {
    try {
      await documentTypeService.delete(Number(req.params.id));
      res.json({ mensaje: 'Tipo de documento eliminado.' });
    } catch (err) { next(err); }
  },
};
