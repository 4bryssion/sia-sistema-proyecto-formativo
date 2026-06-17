import { Router } from 'express';
import multer from 'multer';
import { consumableMaterialController } from './consumableMaterial.controller.js';
import { validate, createConsumableMaterialSchema, updateConsumableMaterialSchema } from './consumableMaterial.validator.js';
import { uploadImage } from '../../middleware/multerConfig.js';

const router = Router();

router.get('/',       consumableMaterialController.getAll);
router.get('/:id',    consumableMaterialController.getById);
router.post('/',      uploadImage.single('image'), validate(createConsumableMaterialSchema), consumableMaterialController.create);
router.put('/:id',          uploadImage.single('image'), validate(updateConsumableMaterialSchema),  consumableMaterialController.update);
router.patch('/:id/toggle', consumableMaterialController.toggle);

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
