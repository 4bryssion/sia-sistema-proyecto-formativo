import { categoryService } from './category.service.js';

export const categoryController = {
  async getAll(req, res, next) {
    try { res.json(await categoryService.getAll()); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await categoryService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
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

  async toggle(req, res, next) {
    try {
      const data = await categoryService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Categoría activada.' : 'Categoría desactivada.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
