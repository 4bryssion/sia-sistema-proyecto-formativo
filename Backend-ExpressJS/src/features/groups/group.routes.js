import { Router } from 'express';
import { groupController } from './group.controller.js';
import { validate, createGroupSchema, updateGroupSchema, assignPermissionSchema, updatePermissionsSchema } from './group.validator.js';

const router = Router();

router.get('/', groupController.getAll);
// Rutas específicas antes de /:id para que Express no interprete "permissions" como un id
router.get('/:id/permissions', groupController.getPermissions);
router.get('/:id',             groupController.getById);

router.post('/', validate(createGroupSchema), groupController.create);

router.put('/:id/permissions', validate(updatePermissionsSchema), groupController.updatePermissions);
router.put('/:id',             validate(updateGroupSchema),       groupController.update);

router.patch('/:id/toggle', groupController.toggle);

router.post('/:id/permissions',                 validate(assignPermissionSchema), groupController.assignPermission);
router.delete('/:id/permissions/:permissionId', groupController.removePermission);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
