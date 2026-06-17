import { Router } from 'express';
import { groupController } from './group.controller.js';
import { validate, createGroupSchema, updateGroupSchema, assignPermissionSchema } from './group.validator.js';

const router = Router();

router.get('/',       groupController.getAll);
router.get('/:id',    groupController.getById);
router.post('/',      validate(createGroupSchema), groupController.create);
router.put('/:id',    validate(updateGroupSchema),  groupController.update);
router.delete('/:id', groupController.delete);

router.post('/:id/permissions',                 validate(assignPermissionSchema), groupController.assignPermission);
router.delete('/:id/permissions/:permissionId', groupController.removePermission);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
