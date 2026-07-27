import { Router } from 'express';
import { accessController } from './access.controller.js';
import { validate, assignGroupSchema, assignPermissionSchema } from './access.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Debe registrarse antes de /:userId/... para evitar colisiones cuando permissionCode sea "groups" o "permissions"
router.get('/check/:permissionCode', authenticateToken, accessController.checkPermission);

router.get('/:userId/groups',              accessController.getGroups);
router.post('/:userId/groups',             validate(assignGroupSchema), accessController.assignGroup);
router.delete('/:userId/groups/:groupId',  accessController.removeGroup);

router.get('/:userId/permissions',                   accessController.getPermissions);
router.post('/:userId/permissions',                  validate(assignPermissionSchema), accessController.assignPermission);
router.delete('/:userId/permissions/:permissionId',  accessController.removePermission);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
