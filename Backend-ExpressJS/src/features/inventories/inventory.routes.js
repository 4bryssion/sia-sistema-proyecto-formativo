import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { validate, createInventorySchema, updateInventorySchema } from './inventory.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('list_inventories'),                 inventoryController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_inventories'),              inventoryController.getById);
router.post('/', authenticateToken, requirePermission('create_inventory'),                validate(createInventorySchema), inventoryController.create);
router.put('/:id', authenticateToken, requirePermission('edit_inventory'),                validate(updateInventorySchema), inventoryController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_inventory'),     inventoryController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
