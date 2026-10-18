import { settingService } from './setting.service.js';

export const settingController = {
  async getSupportEmail(req, res, next) {
    try { res.json(await settingService.getSupportEmail()); }
    catch (err) { next(err); }
  },

  async updateSupportEmail(req, res, next) {
    try {
      const data = await settingService.updateSupportEmail(req.body.supportEmail);
      res.json({ mensaje: 'Correo de soporte actualizado.', data });
    } catch (err) { next(err); }
  },
};
