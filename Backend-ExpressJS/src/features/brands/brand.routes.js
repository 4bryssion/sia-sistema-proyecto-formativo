import { Router } from 'express';
import { brandController } from './brand.controller.js';
import { validate, createBrandSchema, updateBrandSchema } from './brand.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('list_brands'),             brandController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_brands'),          brandController.getById);
router.post('/', authenticateToken, requirePermission('create_brand'),            validate(createBrandSchema), brandController.create);
router.put('/:id', authenticateToken, requirePermission('edit_brand'),          validate(updateBrandSchema), brandController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_brand'), brandController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
