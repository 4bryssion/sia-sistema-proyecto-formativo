import { Router } from 'express';
import multer from 'multer';
import { returnableMaterialController } from './returnableMaterial.controller.js';
import { validate, createReturnableMaterialSchema, updateReturnableMaterialSchema } from './returnableMaterial.validator.js';
import { uploadFiles, limitarTamanoTotal } from '../../middleware/multerConfig.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// (p48) La imagen dejó de ser una sola: hasta 3, en consumable_material_images.
// La ficha técnica también admite hasta 3, ahora en material_files (tabla padre).
const uploadFields = uploadFiles.fields([
  { name: 'image', maxCount: 3 },
  { name: 'technical_sheet', maxCount: 3 },
]);

router.get('/', authenticateToken, requirePermission('list_returnable_materials'),       returnableMaterialController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_returnable_materials'),    returnableMaterialController.getById);
// (p50) limitarTamanoTotal va ANTES de multer: cortar aquí evita escribir en
// disco una carga que se va a rechazar de todos modos.
router.post('/', authenticateToken, requirePermission('create_returnable_material'),      limitarTamanoTotal, uploadFields, validate(createReturnableMaterialSchema), returnableMaterialController.create);
router.put('/:id', authenticateToken, requirePermission('edit_returnable_material'),          limitarTamanoTotal, uploadFields, validate(updateReturnableMaterialSchema),  returnableMaterialController.update);
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
