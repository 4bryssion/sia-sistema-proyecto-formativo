import { notificationService } from './notification.service.js';

export const notificationController = {
  async getAll(req, res, next) {
    try {
      res.json(await notificationService.getForCurrentUser(req.user.id));
    } catch (err) { next(err); }
  },

  async unread(req, res, next) {
    try {
      res.json(await notificationService.hayNuevas(req.user.id));
    } catch (err) { next(err); }
  },

  async markSeen(req, res, next) {
    try {
      res.json(await notificationService.marcarVistas(req.user.id));
    } catch (err) { next(err); }
  },
};
