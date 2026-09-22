import { quotationService } from './quotation.service.js';

export const quotationController = {
  async getAll(req, res, next) {
    try { res.json(await quotationService.getAll(req.query.status)); }
    catch (err) { next(err); }
  },

  // (p50) Comprobación previa: el navegador manda las huellas de lo que piensa
  // subir y se le contesta qué ya existe. No sube ningún archivo.
  async duplicados(req, res, next) {
    try {
      res.json(await quotationService.buscarPorHashes(req.body?.hashes ?? []));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await quotationService.createFromFiles(req.files);
      res.status(201).json({
        mensaje: data.length === 1 ? 'Cotización cargada.' : `${data.length} cotizaciones cargadas.`,
        data,
      });
    } catch (err) { next(err); }
  },

  async toggle(req, res, next) {
    try {
      const data = await quotationService.toggle(Number(req.params.id));
      res.json({
        mensaje: data.isActive ? 'Cotización habilitada.' : 'Cotización deshabilitada.',
        data,
      });
    } catch (err) { next(err); }
  },
};
