import { Router } from 'express';
import { permissionController } from './permission.controller.js';
import { validate, createPermissionSchema, updatePermissionSchema } from './permission.validator.js';

const router = Router();

router.get('/',       permissionController.getAll);
router.get('/:id',    permissionController.getById);
router.post('/',      validate(createPermissionSchema), permissionController.create);
router.put('/:id',    validate(updatePermissionSchema),  permissionController.update);
router.delete('/:id', permissionController.delete);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
