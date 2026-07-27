import { Router } from 'express';
import { loanReturnController } from './loanReturn.controller.js';
import { validate, createLoanReturnSchema } from './loanReturn.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/',             authenticateToken, loanReturnController.getAll);
router.get('/:id',          authenticateToken, loanReturnController.getById);
router.post('/',            authenticateToken, validate(createLoanReturnSchema), loanReturnController.create);
router.patch('/:id/toggle', authenticateToken, loanReturnController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
