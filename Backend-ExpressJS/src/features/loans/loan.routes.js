import { Router } from 'express';
import { loanController } from './loan.controller.js';
import { validate, createLoanSchema, updateLoanSchema, signLoanSchema } from './loan.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// PÚBLICAS (el token del enlace es la autenticación) — declaradas ANTES de '/:id', si no
// Express interpreta "sign" como id.
router.get('/sign',  loanController.getSignatureInfo);
router.post('/sign', validate(signLoanSchema), loanController.sign);

router.get('/',                     authenticateToken, loanController.getAll);
router.get('/:id',                  authenticateToken, loanController.getById);
router.post('/',                    authenticateToken, validate(createLoanSchema), loanController.create);
router.put('/:id',                  authenticateToken, validate(updateLoanSchema), loanController.update);
router.patch('/:id/toggle',         authenticateToken, loanController.toggle);
router.post('/:id/resend-signatures', authenticateToken, loanController.resendSignatures);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
