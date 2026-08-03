import { notificationService } from './notification.service.js';

export const notificationController = {
  async getAll(req, res, next) {
    try {
      res.json(await notificationService.getAll());
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      res.json(await notificationService.getById(Number(req.params.id)));
    } catch (err) { next(err); }
  },
};
