import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { validate, createCategorySchema, updateCategorySchema } from './category.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('list_categories'),             categoryController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_categories'),          categoryController.getById);
router.post('/', authenticateToken, requirePermission('create_category'),            validate(createCategorySchema), categoryController.create);
router.put('/:id', authenticateToken, requirePermission('edit_category'),          validate(updateCategorySchema), categoryController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_category'), categoryController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
