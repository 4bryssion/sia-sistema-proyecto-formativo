import { Router } from 'express';
import multer from 'multer';
import { consumableMaterialController } from './consumableMaterial.controller.js';
import { validate, createConsumableMaterialSchema, updateConsumableMaterialSchema } from './consumableMaterial.validator.js';
import { uploadFiles, limitarTamanoTotal } from '../../middleware/multerConfig.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// (p48) El material de consumo pasó de uploadImage.single a los mismos dos campos
// del devolutivo: hasta 3 imágenes y hasta 3 fichas técnicas. El filtro de multer
// es POR CAMPO (ALLOWED_BY_FIELD), así que un PDF no puede colarse como imagen.
const uploadFields = uploadFiles.fields([
  { name: 'image', maxCount: 3 },
  { name: 'technical_sheet', maxCount: 3 },
]);

router.get('/', authenticateToken, requirePermission('list_consumable_materials'),       consumableMaterialController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_consumable_materials'),    consumableMaterialController.getById);
// (p50) limitarTamanoTotal va ANTES de multer: cortar aquí evita escribir en
// disco una carga que se va a rechazar de todos modos.
router.post('/', authenticateToken, requirePermission('create_consumable_material'),      limitarTamanoTotal, uploadFields, validate(createConsumableMaterialSchema), consumableMaterialController.create);
router.put('/:id', authenticateToken, requirePermission('edit_consumable_material'),          limitarTamanoTotal, uploadFields, validate(updateConsumableMaterialSchema),  consumableMaterialController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_consumable_material'), consumableMaterialController.toggle);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Con fields(), pasarse del maxCount de un campo NO llega como
    // LIMIT_FILE_COUNT sino como LIMIT_UNEXPECTED_FILE del campo desbordado;
    // por eso el mensaje se afina con err.field
    const mensajes = {
      LIMIT_FILE_SIZE:       'El archivo supera el límite de 5MB.',
      LIMIT_UNEXPECTED_FILE:
        err.field === 'technical_sheet'
          ? 'Solo se permiten hasta 3 fichas técnicas.'
          : err.field === 'image'
            ? 'Solo se permiten hasta 3 imágenes del material.'
            : 'Campo de archivo inesperado.',
      LIMIT_FILE_COUNT:      'Se enviaron demasiados archivos.',
    };
    return res.status(400).json({ error: mensajes[err.code] ?? err.message });
  }
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
