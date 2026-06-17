import { Router } from 'express';
import multer from 'multer';
import { userController } from './user.controller.js';
import { validate, validateUpdate, createUserSchema, updateUserSchema } from './user.validator.js';
import { uploadImage } from '../../middleware/multerConfig.js';

const router = Router();

router.get('/',             userController.getAll);
router.get('/:id',          userController.getById);
router.post('/',            uploadImage.single('image'), validate(createUserSchema), userController.create);
router.put('/:id',          uploadImage.single('image'), validateUpdate(updateUserSchema), userController.update);
router.patch('/:id/toggle', userController.toggle);

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
