import { Router } from 'express';
import { taskController } from './task.controller.js';
import { validate, createTaskSchema, updateTaskSchema } from './task.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

// Un usuario siempre puede consultar SUS propias tareas ("Ver mis tareas" del perfil),
// aunque no tenga list_tasks (Instructor/Invitado no lo tienen). Para las de otros, sí se exige.
const ownTasksOrListAll = (req, res, next) => {
  if (Number(req.params.userId) === Number(req.user.id)) return next();
  return requirePermission('list_tasks')(req, res, next);
};

const router = Router();

router.get('/', authenticateToken, requirePermission('list_tasks'),             taskController.getAll);
router.get('/user/:userId', authenticateToken, ownTasksOrListAll, taskController.getByUser);
router.get('/:id', authenticateToken, requirePermission('list_tasks'),          taskController.getById);
router.post('/', authenticateToken, requirePermission('create_task'),            validate(createTaskSchema),  taskController.create);
router.put('/:id', authenticateToken, requirePermission('edit_task'),          validate(updateTaskSchema),  taskController.update);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_task'), taskController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
