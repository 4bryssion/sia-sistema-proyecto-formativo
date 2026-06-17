import { Router } from 'express';
import { brandController } from './brand.controller.js';
import { validate, createBrandSchema, updateBrandSchema } from './brand.validator.js';

const router = Router();

router.get('/',       brandController.getAll);
router.get('/:id',    brandController.getById);
router.post('/',      validate(createBrandSchema), brandController.create);
router.put('/:id',    validate(updateBrandSchema), brandController.update);
router.delete('/:id', brandController.delete);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
