import { auditService } from './audit.service.js';

export const auditController = {
  async getRange(req, res, next) {
    try {
      res.json(await auditService.getRange(req.query.from, req.query.to));
    } catch (err) { next(err); }
  },
};
