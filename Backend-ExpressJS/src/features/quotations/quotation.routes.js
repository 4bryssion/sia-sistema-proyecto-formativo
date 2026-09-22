import { Router } from 'express';
import { quotationController } from './quotation.controller.js';
import { uploadQuotations, limitarTamanoTotal } from '../../middleware/multerConfig.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { MAX_POR_CARGA } from './quotation.service.js';

const router = Router();

// No hay PUT: una cotización es un archivo. Lo que se corrige de un archivo
// equivocado es cargar el correcto y deshabilitar el anterior, no reescribirlo
// — si se pudiera sustituir el PDF conservando el id, el respaldo de un precio
// ya aprobado podría cambiar sin dejar rastro.
router.get('/', authenticateToken, requirePermission('list_quotations'), quotationController.getAll);

// (p50) Comprobación previa de duplicados. Es POST y no GET porque manda una
// lista de huellas en el cuerpo, pero no escribe nada: solo consulta.
//
// Pide `create_quotation` y no `list_quotations` porque solo tiene sentido justo
// antes de cargar: a quien no puede cargar no le sirve de nada saberlo.
router.post('/duplicados', authenticateToken, requirePermission('create_quotation'), quotationController.duplicados);

// Cada PDF del envío se convierte en una cotización distinta.
// limitarTamanoTotal va ANTES de multer: cortar aquí evita escribir en disco una
// carga que se va a rechazar igualmente.
router.post(
  '/',
  authenticateToken,
  requirePermission('create_quotation'),
  limitarTamanoTotal,
  uploadQuotations.array('quotation', MAX_POR_CARGA),
  quotationController.create,
);

router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_quotation'), quotationController.toggle);

// Handler local: los errores de multer (archivo muy grande, tipo no permitido,
// demasiados archivos) llegan aquí antes que al global, que respondería 400 sin
// explicar qué pasó.
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Alguno de los archivos supera el máximo de 10MB.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: `Se pueden cargar máximo ${MAX_POR_CARGA} cotizaciones por envío.` });
  }
  next(err);
});

export default router;
