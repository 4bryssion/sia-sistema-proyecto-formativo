import { Router } from 'express';
import multer from 'multer';
import { consumableMaterialController } from './consumableMaterial.controller.js';
import { validate, createConsumableMaterialSchema, updateConsumableMaterialSchema } from './consumableMaterial.validator.js';
import { uploadImage } from '../../middleware/multerConfig.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('list_consumable_materials'),       consumableMaterialController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_consumable_materials'),    consumableMaterialController.getById);
router.post('/', authenticateToken, requirePermission('create_consumable_material'),      uploadImage.single('image'), validate(createConsumableMaterialSchema), consumableMaterialController.create);
router.put('/:id', authenticateToken, requirePermission('edit_consumable_material'),          uploadImage.single('image'), validate(updateConsumableMaterialSchema),  consumableMaterialController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_consumable_material'), consumableMaterialController.toggle);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const mensajes = {
      LIMIT_FILE_SIZE:       'El archivo supera el límite de 5MB.',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado.',
      LIMIT_FILE_COUNT:      'Se enviaron demasiados archivos.',
    };
    return res.status(400).json({ error: mensajes[err.code] ?? err.message });
  }
  if (err.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({ error: err.message });
  }
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
