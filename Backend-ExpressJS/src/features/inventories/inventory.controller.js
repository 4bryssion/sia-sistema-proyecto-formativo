import { inventoryService } from './inventory.service.js';

export const inventoryController = {
  async getAll(req, res, next) {
    try { res.json(await inventoryService.getAll(req.query.status)); }
    catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { res.json(await inventoryService.getById(Number(req.params.id))); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await inventoryService.create(req.body);
      res.status(201).json({ mensaje: 'Inventario creado.', data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await inventoryService.update(Number(req.params.id), req.body);
      res.json({ mensaje: 'Inventario actualizado.', data });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await inventoryService.toggle(Number(req.params.id));
      const mensaje = data.isActive ? 'Inventario activado.' : 'Inventario desactivado.';
      res.json({ mensaje, data });
    } catch (err) { next(err); }
  },
};
