import { Router } from 'express';
import { loanReturnController } from './loanReturn.controller.js';
import { validate, createLoanReturnSchema } from './loanReturn.validator.js';

const router = Router();

router.get('/',       loanReturnController.getAll);
router.get('/:id',    loanReturnController.getById);
router.post('/',      validate(createLoanReturnSchema), loanReturnController.create);
router.delete('/:id', loanReturnController.delete);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
