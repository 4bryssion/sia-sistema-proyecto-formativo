import { Router } from 'express';
import multer from 'multer';
import { userController } from './user.controller.js';
import { validate, validateUpdate, createUserSchema, updateUserSchema, toggleUserSchema } from './user.validator.js';
import { uploadImage, limitarTamanoTotal } from '../../middleware/multerConfig.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { errorDeNegocio } from '../../middleware/errorHandler.js';

// Cualquier usuario puede ver SU propio perfil ("Mi perfil" del navbar) aunque no
// tenga list_users (Instructor/Invitado no lo tienen). Para otros perfiles, sí se exige.
const ownProfileOrListAll = (req, res, next) => {
  if (Number(req.params.id) === Number(req.user.id)) return next();
  return requirePermission('list_users')(req, res, next);
};

const router = Router();

// (p51) Dos puertas: quien entra al módulo de usuarios (`list_users`) y quien
// solo necesita la lista para un desplegable (`select_users`, lo del
// Instructor). Antes el Instructor tenía `list_users` por el segundo motivo, y
// eso obligaba a guardar la PANTALLA de usuarios con `create_user`/`edit_user`
// en vez de con `list_users`.
router.get('/', authenticateToken, requirePermission(['list_users', 'select_users']), userController.getAll);
router.get('/:id', authenticateToken, ownProfileOrListAll,          userController.getById);
router.post('/', authenticateToken, requirePermission('create_user'),            limitarTamanoTotal, uploadImage.single('image'), validate(createUserSchema), userController.create);
router.put('/:id', authenticateToken, requirePermission('edit_user'),          limitarTamanoTotal, uploadImage.single('image'), validateUpdate(updateUserSchema), userController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_user'), validate(toggleUserSchema), userController.toggle);

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
  // (p52) Lo que no es de multer lo decide el manejador compartido: un fallo de
  // programacion no puede salir como 400 con el texto de JavaScript.
  return errorDeNegocio(err, req, res, next);
});

export default router;
