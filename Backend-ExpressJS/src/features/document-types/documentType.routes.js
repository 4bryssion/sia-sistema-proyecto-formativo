import { Router } from 'express';
import { documentTypeController } from './documentType.controller.js';
import { validate, createDocumentTypeSchema, updateDocumentTypeSchema } from './documentType.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('list_document_types'),             documentTypeController.getAll);
router.get('/:id', authenticateToken, requirePermission('list_document_types'),          documentTypeController.getById);
router.post('/', authenticateToken, requirePermission('create_document_type'),            validate(createDocumentTypeSchema), documentTypeController.create);
router.put('/:id', authenticateToken, requirePermission('edit_document_type'),          validate(updateDocumentTypeSchema), documentTypeController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_document_type'), documentTypeController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
