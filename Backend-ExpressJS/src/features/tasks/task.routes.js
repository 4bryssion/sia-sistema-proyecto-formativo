import { Router } from 'express';
import { taskController } from './task.controller.js';
import { taskService } from './task.service.js';
import { accessService } from '../access/access.service.js';
import { validate, createTaskSchema, updateTaskSchema, statusTaskSchema } from './task.validator.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

// (p50) Dos permisos, dos alcances:
//   - `list_tasks`      → las tareas de TODO el mundo (quien asigna y supervisa),
//   - `manage_own_tasks` → solo las propias: verlas y decir si están hechas.
//
// El segundo es un permiso y no "cualquiera autenticado" para que el módulo se
// pueda cerrar por completo a un grupo sin tocar código, igual que el resto.
const MIS_TAREAS = 'manage_own_tasks';

// Consultar las tareas de un usuario: si son las suyas basta el permiso propio.
const ownTasksOrListAll = (req, res, next) => {
  if (Number(req.params.userId) === Number(req.user.id)) {
    return requirePermission(MIS_TAREAS)(req, res, next);
  }
  return requirePermission('list_tasks')(req, res, next);
};

// (p50) Igual que el anterior pero para UNA tarea, cuyo dueño no se sabe hasta
// leerla. Lo necesita el modal de visualizar: un aprendiz abre su propia tarea
// desde el listado sin tener `list_tasks`.
const ownTaskOrListAll = async (req, res, next) => {
  try {
    const tarea = await taskService.getById(Number(req.params.id));
    if (Number(tarea.userId) === Number(req.user.id)) {
      return requirePermission(MIS_TAREAS)(req, res, next);
    }
    return requirePermission('list_tasks')(req, res, next);
  } catch (err) { next(err); }
};

// (p50) No bloquea: solo APUNTA si quien pide puede editar cualquier tarea. El
// service lo usa para distinguir "la mía" de "cualquiera", y quien no tenga el
// permiso sigue pasando, porque puede cambiar el estado de la suya.
const marcarSiPuedeEditar = async (req, res, next) => {
  try {
    req.puedeEditarTareas = await accessService.hasPermission(req.user.id, 'edit_task');
    next();
  } catch (err) { next(err); }
};

const router = Router();

router.get('/', authenticateToken, requirePermission('list_tasks'),             taskController.getAll);
router.get('/user/:userId', authenticateToken, ownTasksOrListAll, taskController.getByUser);
router.get('/:id', authenticateToken, ownTaskOrListAll,                          taskController.getById);
router.post('/', authenticateToken, requirePermission('create_task'),            validate(createTaskSchema),  taskController.create);
router.put('/:id', authenticateToken, requirePermission('edit_task'),          validate(updateTaskSchema),  taskController.update);
// Solo el estado. Quien tiene `edit_task` cambia el de cualquiera; quien solo
// tiene `manage_own_tasks`, el de las suyas —y el service lo comprueba de nuevo
// contra la tarea, que es donde consta de quién es.
router.patch(
  '/:id/status',
  authenticateToken,
  requirePermission(MIS_TAREAS),
  marcarSiPuedeEditar,
  validate(statusTaskSchema),
  taskController.setStatus,
);
router.patch('/:id/toggle', authenticateToken, requirePermission('toggle_task'), taskController.toggle);

router.use((err, req, res, next) => {
  if (err.message && !err.code) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
