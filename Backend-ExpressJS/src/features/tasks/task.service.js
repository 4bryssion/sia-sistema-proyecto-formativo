import { taskRepository } from './task.repository.js';
import { notify } from '../notifications/notification.service.js';

// Medianoche de hoy (para comparar fechas sin hora)
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const taskService = {
  async getAll() {
    await taskRepository.markOverdue();          // aplica vencimiento antes de listar
    return taskRepository.findAll();
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
    notify({
      title: 'Tarea asignada',
      description: `Se asignó la tarea "${created.taskName}" al usuario #${created.userId}.`,
      module: 'tasks',
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
    notify({
      title: 'Tarea modificada',
      description: `Se actualizó la tarea "${updated.taskName}" (estado: ${updated.status}).`,
      module: 'tasks',
    });
    return updated;
  },

  async toggle(id) {
    const record = await taskService.getById(id);
    const updated = await taskRepository.toggle(id, !record.isActive);
    notify({
      title: updated.isActive ? 'Tarea activada' : 'Tarea desactivada',
      description: `"${updated.taskName}" quedó ${updated.isActive ? 'activa' : 'inactiva'}.`,
      severity: updated.isActive ? 'Informativa' : 'Advertencia',
      module: 'tasks',
    });
    return updated;
  },
};
