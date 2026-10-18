import { Router } from 'express';
import { loanReturnController } from './loanReturn.controller.js';
import { validate, createLoanReturnSchema } from './loanReturn.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { errorDeNegocio } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/',             authenticateToken, requirePermission('list_loan_returns'), loanReturnController.getAll);
router.get('/:id',          authenticateToken, requirePermission('list_loan_returns'), loanReturnController.getById);
router.post('/',            authenticateToken, requirePermission('create_loan_return'), validate(createLoanReturnSchema), loanReturnController.create);
router.patch('/:id/toggle', authenticateToken, requirePermission('create_loan_return'), loanReturnController.toggle);

router.use(errorDeNegocio);

export default router;
