import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// Solo lectura, y solo con `download_audit` — permiso que en el seed no está en
// la matriz de ningún rol, así que únicamente lo tiene el grupo SuperAdmin.
//
// No hay ruta para borrar ni editar: una auditoría que se puede modificar desde
// el propio sistema no sirve como auditoría.
router.get('/', authenticateToken, requirePermission('download_audit'), auditController.getRange);

export default router;
