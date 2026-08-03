import { Router } from 'express';
import multer from 'multer';
import { returnableMaterialController } from './returnableMaterial.controller.js';
import { validate, createReturnableMaterialSchema, updateReturnableMaterialSchema } from './returnableMaterial.validator.js';
import { uploadFiles } from '../../middleware/multerConfig.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// La imagen sigue siendo una sola (columna `image` del material padre);
// la ficha técnica admite hasta 3 archivos, guardados en returnable_material_files
const uploadFields = uploadFiles.fields([
  { name: 'image', maxCount: 1 },
  { name: 'technical_sheet', maxCount: 3 },
]);

router.get('/', authenticateToken, requirePermission('list_returnable_materials'),       returnableMaterialController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_returnable_materials'),    returnableMaterialController.getById);
router.post('/', authenticateToken, requirePermission('create_returnable_material'),      uploadFields, validate(createReturnableMaterialSchema), returnableMaterialController.create);
router.put('/:id', authenticateToken, requirePermission('edit_returnable_material'),          uploadFields, validate(updateReturnableMaterialSchema),  returnableMaterialController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_returnable_material'), returnableMaterialController.toggle);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Con fields(), pasarse del maxCount de un campo NO llega como
    // LIMIT_FILE_COUNT sino como LIMIT_UNEXPECTED_FILE del campo desbordado;
    // por eso el mensaje se afina con err.field en vez de hablar de "campo
    // inesperado", que al usuario no le dice nada
    const mensajes = {
      LIMIT_FILE_SIZE:       'El archivo supera el límite de 5MB.',
      LIMIT_UNEXPECTED_FILE:
        err.field === 'technical_sheet'
          ? 'Solo se permiten hasta 3 fichas técnicas.'
          : err.field === 'image'
            ? 'Solo se permite una imagen del material.'
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
