import { Router } from 'express';
import { taskController } from './task.controller.js';
import { validate, createTaskSchema, updateTaskSchema } from './task.validator.js';

const router = Router();

router.get('/',             taskController.getAll);
router.get('/user/:userId', taskController.getByUser);
router.get('/:id',          taskController.getById);
router.post('/',            validate(createTaskSchema), taskController.create);
router.put('/:id',          validate(updateTaskSchema),  taskController.update);
router.delete('/:id',       taskController.delete);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
