import { Router } from 'express';
import { permissionController } from './permission.controller.js';
import { validate, createPermissionSchema, updatePermissionSchema } from './permission.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('list_permissions'),             permissionController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_permissions'),          permissionController.getById);
router.post('/', authenticateToken, requirePermission('create_permission'),            validate(createPermissionSchema), permissionController.create);
router.put('/:id', authenticateToken, requirePermission('edit_permission'),          validate(updatePermissionSchema),  permissionController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_permission'), permissionController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
