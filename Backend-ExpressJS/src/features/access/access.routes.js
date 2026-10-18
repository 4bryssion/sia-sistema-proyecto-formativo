import { Router } from 'express';
import { accessController } from './access.controller.js';
import { validate, assignGroupSchema, assignPermissionSchema } from './access.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { errorDeNegocio } from '../../middleware/errorHandler.js';

const router = Router();

// Debe registrarse antes de /:userId/... para evitar colisiones cuando permissionCode sea "groups" o "permissions"
router.get('/check/:permissionCode', authenticateToken, accessController.checkPermission);

// Permisos efectivos del usuario autenticado — base del control de acceso del frontend.
// Antes de /:userId/... para que "me" no se confunda con un id.
router.get('/me/permissions', authenticateToken, accessController.myPermissions);

// (p51) Estas seis rutas NO tenían ni `authenticateToken`. Cualquiera, sin
// iniciar sesión, podía hacer un POST aquí y concederle el grupo SuperAdmin a
// quien quisiera: escalada de privilegios completa y anónima, en el módulo que
// decide qué puede hacer todo el mundo.
//
// Los cuatro permisos de asignación existían en el seed desde P36 y nadie los
// comprobaba. Ahora sí. Las dos lecturas piden `list_permissions`, que es el
// mismo que ya protege la pantalla de administración de permisos en el router
// del frontend: quien puede abrir esa pantalla puede consultar lo que muestra.
router.get('/:userId/groups',              authenticateToken, requirePermission('list_permissions'),            accessController.getGroups);
router.post('/:userId/groups',             authenticateToken, requirePermission('assign_group_to_user'),        validate(assignGroupSchema), accessController.assignGroup);
router.delete('/:userId/groups/:groupId',  authenticateToken, requirePermission('remove_group_from_user'),      accessController.removeGroup);

router.get('/:userId/permissions',                   authenticateToken, requirePermission('list_permissions'),             accessController.getPermissions);
router.post('/:userId/permissions',                  authenticateToken, requirePermission('assign_permission_to_user'),    validate(assignPermissionSchema), accessController.assignPermission);
router.delete('/:userId/permissions/:permissionId',  authenticateToken, requirePermission('remove_permission_from_user'),  accessController.removePermission);

router.use(errorDeNegocio);

export default router;
