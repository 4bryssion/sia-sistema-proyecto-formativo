import { categoryService } from './category.service.js';

export const categoryController = {
  async getAll(req, res, next) {
    try {
      const data = await categoryService.getAll();
      res.json(data);
    } catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try {
      const data = await categoryService.getById(Number(req.params.id));
      res.json(data);
    } catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const data = await categoryService.create(req.body);
      res.status(201).json({ mensaje: 'Categoría creada.', data });
    } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try {
      const data = await categoryService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Categoría actualizada.', data });
    } catch (err) { next(err); }
  },
  async delete(req, res, next) {
    try {
      await categoryService.delete(Number(req.params.id));
      res.json({ mensaje: 'Categoría eliminada.' });
    } catch (err) { next(err); }
  },
};
