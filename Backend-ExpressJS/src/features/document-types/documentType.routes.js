import { Router } from 'express';
import { documentTypeController } from './documentType.controller.js';
import { validate, createDocumentTypeSchema, updateDocumentTypeSchema } from './documentType.validator.js';

const router = Router();

router.get('/',       documentTypeController.getAll);
router.get('/:id',    documentTypeController.getById);
router.post('/',      validate(createDocumentTypeSchema), documentTypeController.create);
router.put('/:id',    validate(updateDocumentTypeSchema), documentTypeController.update);
router.delete('/:id', documentTypeController.delete);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
