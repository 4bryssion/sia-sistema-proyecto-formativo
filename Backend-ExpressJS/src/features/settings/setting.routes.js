import { Router } from 'express';
import { settingController } from './setting.controller.js';
import { validate, updateSupportEmailSchema } from './setting.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { errorDeNegocio } from '../../middleware/errorHandler.js';

const router = Router();

// (p53) PÚBLICA a propósito, y es la única de este módulo que lo es. El modal de
// soporte del login lo abre quien NO tiene sesión —o no puede iniciarla—, que es
// exactamente a quien está dirigido. Lo que expone es un dato que el sistema
// publica para ser contactado, no información de nadie: el correo de soporte.
router.get('/support-email', settingController.getSupportEmail);

// Escribirlo es administración del sistema: permiso propio y RESTRINGIDO, así
// que el Administrador puede cambiarlo pero no puede concederle a otro rol la
// capacidad de cambiarlo.
router.put(
  '/support-email',
  authenticateToken,
  requirePermission('edit_support_email'),
  validate(updateSupportEmailSchema),
  settingController.updateSupportEmail,
);

router.use(errorDeNegocio);

export default router;
