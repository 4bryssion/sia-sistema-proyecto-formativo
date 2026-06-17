import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { validate, createCategorySchema, updateCategorySchema } from './category.validator.js';

const router = Router();

router.get('/',       categoryController.getAll);
router.get('/:id',    categoryController.getById);
router.post('/',      validate(createCategorySchema), categoryController.create);
router.put('/:id',    validate(updateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.delete);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
