import { Router } from 'express';
import { devolutionController } from './devolution.controller.js';
import { validate, createDevolutionSchema, authorizeDevolutionSchema } from './devolution.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// Registrar reutiliza `create_loan_return` (lo tienen los tres roles: el receptor
// devuelve lo suyo). Autorizar exige `authorize_devolution`, que solo tienen
// Administrador e Instructor: es la fase que mueve inventario.
router.get('/',                authenticateToken, requirePermission('list_loan_returns'),   devolutionController.getAll);
router.get('/:id',             authenticateToken, requirePermission('list_loan_returns'),   devolutionController.getById);
router.post('/',               authenticateToken, requirePermission('create_loan_return'),  validate(createDevolutionSchema), devolutionController.create);
router.patch('/:id/authorize', authenticateToken, requirePermission('authorize_devolution'), validate(authorizeDevolutionSchema), devolutionController.authorize);
router.patch('/:id/toggle',    authenticateToken, requirePermission('create_loan_return'),  devolutionController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
