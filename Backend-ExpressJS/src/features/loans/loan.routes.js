import { Router } from 'express';
import { loanController } from './loan.controller.js';
import { validate, createLoanSchema, updateLoanSchema } from './loan.validator.js';

const router = Router();

router.get('/',             loanController.getAll);
router.get('/:id',          loanController.getById);
router.post('/',            validate(createLoanSchema), loanController.create);
router.put('/:id',          validate(updateLoanSchema), loanController.update);
router.patch('/:id/toggle', loanController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
