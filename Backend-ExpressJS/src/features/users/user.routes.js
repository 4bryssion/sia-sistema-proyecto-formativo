import { Router } from 'express';
import multer from 'multer';
import { userController } from './user.controller.js';
import { validate, validateUpdate, createUserSchema, updateUserSchema } from './user.validator.js';
import { uploadImage } from '../../middleware/multerConfig.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

// Cualquier usuario puede ver SU propio perfil ("Mi perfil" del navbar) aunque no
// tenga list_users (Instructor/Invitado no lo tienen). Para otros perfiles, sí se exige.
const ownProfileOrListAll = (req, res, next) => {
  if (Number(req.params.id) === Number(req.user.id)) return next();
  return requirePermission('list_users')(req, res, next);
};

const router = Router();

router.get('/', authenticateToken, requirePermission('list_users'),             userController.getAll);
router.get('/:id', authenticateToken, ownProfileOrListAll,          userController.getById);
router.post('/', authenticateToken, requirePermission('create_user'),            uploadImage.single('image'), validate(createUserSchema), userController.create);
router.put('/:id', authenticateToken, requirePermission('edit_user'),          uploadImage.single('image'), validateUpdate(updateUserSchema), userController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_user'), userController.toggle);

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
