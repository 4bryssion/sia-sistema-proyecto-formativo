import { taskRepository } from './task.repository.js';
import { notify } from '../notifications/notification.service.js';

// Medianoche de hoy (para comparar fechas sin hora)
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const taskService = {
  // (p50) `status` es el query param del listado: "active" | "inactive" | "all".
  // Es el estado del REGISTRO (activo/inactivo), no el de la tarea: el estado de
  // la tarea —en progreso, completada, no completada— se filtra en la tabla,
  // igual que el tipo de usuario en el listado de usuarios.
  async getAll(status) {
    await taskRepository.markOverdue();          // aplica vencimiento antes de listar
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    return taskRepository.findAll(filter);
  },

  async getByUser(userId) {
    await taskRepository.markOverdue();
    return taskRepository.findByUser(userId);
  },

  async getById(id) {
    await taskRepository.markOverdue();
    const tarea = await taskRepository.findById(id);
    if (!tarea) throw new Error('Tarea no encontrada.');
    return tarea;
  },

  async create(bodyData) {
    // Joi (date().iso()) ya convirtió endDate a Date en UTC medianoche; se compara
    // por fecha de calendario (toISOString) contra hoy local para no rechazar el
    // mismo día por desfase de zona horaria (bug: en UTC-5 "hoy" quedaba < medianoche local)
    const endDate = new Date(bodyData.endDate);
    const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
    if (endDate.toISOString().slice(0, 10) < todayLocal) {
      throw new Error('La fecha de fin no puede ser anterior a hoy.');
    }
    const data = {
      ...bodyData,
      userId: Number(bodyData.userId),
      endDate,
    };
    const created = await taskRepository.create(data);
    // (p50) Único aviso de este módulo, y el único que tiene destinatario: le
    // llega a la persona asignada, no al tablero de administradores. Por eso el
    // texto está escrito PARA ella y no sobre ella.
    //
    // No hay aviso al reasignar porque no existe la reasignación: `update`
    // descarta `userId` (RFADMIN49). Si algún día se permitiera, aquí haría
    // falta un segundo aviso.
    notify({
      title: 'Tarea asignada',
      description:
        `Se te asignó la tarea "${created.taskName}". `
        + `Fecha límite: ${new Date(created.endDate).toLocaleDateString('es-CO')}.`,
      module: 'tasks',
      recipientId: created.userId,
    });
    return created;
  },

  async update(id, bodyData) {
    const tarea = await taskService.getById(id);
    const data = { ...bodyData };

    // RFADMIN49: no se reasigna usuario; isActive solo por PATCH /:id/toggle
    delete data.userId;
    delete data.isActive;

    if (data.endDate) {
      // Misma comparación por fecha de calendario que en create (evita el desfase UTC/local)
      const endDate = new Date(data.endDate);
      const inicioLocal = new Date(tarea.created_at).toLocaleDateString('en-CA');
      if (endDate.toISOString().slice(0, 10) < inicioLocal) {
        throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
      }
      data.endDate = endDate;
    }

    const updated = await taskRepository.update(id, data);
    return updated;
  },

  /**
   * (p50) Marcar una tarea propia como completada, o deshacerlo.
   *
   * Existe aparte de `update` porque el permiso es distinto: quien tiene la
   * tarea asignada puede decir si la hizo, pero no puede cambiarle el título,
   * la descripción ni la fecha límite. Con un solo endpoint habría que dar
   * `edit_task` a un aprendiz para que pudiera marcar su propia casilla.
   *
   * @param {number} id
   * @param {number} solicitanteId  quién pide el cambio
   * @param {string} status         'en_progreso' | 'completada'
   * @param {boolean} puedeEditarTodas  tiene `edit_task`
   */
  async setStatus(id, solicitanteId, status, puedeEditarTodas) {
    const tarea = await taskService.getById(id);

    if (!puedeEditarTodas && tarea.userId !== solicitanteId) {
      throw new Error('Solo puedes cambiar el estado de las tareas que tienes asignadas.');
    }
    if (!tarea.isActive) {
      throw new Error('La tarea está inactiva: no se puede cambiar su estado.');
    }
    // `no_completada` no se pone ni se quita a mano: lo decide el vencimiento.
    // Una tarea vencida se queda vencida, y ese es justo el caso que la casilla
    // del listado muestra en gris.
    if (tarea.status === 'no_completada') {
      throw new Error(
        `La tarea venció el ${new Date(tarea.endDate).toLocaleDateString('es-CO', { timeZone: 'UTC' })} `
        + 'sin completarse, así que su estado ya no puede cambiarse.',
      );
    }
    if (!['en_progreso', 'completada'].includes(status)) {
      throw new Error('Estado no válido: una tarea solo se marca como completada o en progreso.');
    }

    return taskRepository.update(id, { status });
  },

  async toggle(id) {
    const record = await taskService.getById(id);
    const updated = await taskRepository.toggle(id, !record.isActive);
    return updated;
  },
};
