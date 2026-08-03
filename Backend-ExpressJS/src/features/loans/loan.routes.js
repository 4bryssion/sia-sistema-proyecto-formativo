import { Router } from 'express';
import { loanController } from './loan.controller.js';
import { validate, createLoanSchema, updateLoanSchema, signLoanSchema } from './loan.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// PÚBLICAS (el token del enlace es la autenticación) — declaradas ANTES de '/:id', si no
// Express interpreta "sign" como id.
router.get('/sign',  loanController.getSignatureInfo);
router.post('/sign', validate(signLoanSchema), loanController.sign);

router.get('/',                     authenticateToken, requirePermission('list_loans'), loanController.getAll);
router.get('/:id',                  authenticateToken, requirePermission('list_loans'), loanController.getById);
router.post('/',                    authenticateToken, requirePermission('create_loan'), validate(createLoanSchema), loanController.create);
router.put('/:id',                  authenticateToken, requirePermission('update_loan'), validate(updateLoanSchema), loanController.update);
router.patch('/:id/toggle',         authenticateToken, requirePermission('toggle_loan'), loanController.toggle);
router.post('/:id/resend-signatures', authenticateToken, requirePermission('update_loan'), loanController.resendSignatures);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
