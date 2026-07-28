import { Router } from 'express';
import { groupController } from './group.controller.js';
import { validate, createGroupSchema, updateGroupSchema, assignPermissionSchema, updatePermissionsSchema } from './group.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('list_groups'), groupController.getAll);
// Rutas específicas antes de /:id para que Express no interprete "permissions" como un id
router.get('/:id/permissions', authenticateToken, requirePermission('list_groups'), groupController.getPermissions);
router.get('/:id', authenticateToken, requirePermission('list_groups'),             groupController.getById);

router.post('/', authenticateToken, requirePermission('create_group'), validate(createGroupSchema), groupController.create);

router.put('/:id/permissions', authenticateToken, requirePermission('assign_permission_to_group'), validate(updatePermissionsSchema), groupController.updatePermissions);
router.put('/:id', authenticateToken, requirePermission('edit_group'),             validate(updateGroupSchema),       groupController.update);

router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_group'), groupController.toggle);

router.post('/:id/permissions', authenticateToken, requirePermission('assign_permission_to_group'),                 validate(assignPermissionSchema), groupController.assignPermission);
router.delete('/:id/permissions/:permissionId', authenticateToken, requirePermission('remove_permission_from_group'), groupController.removePermission);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
