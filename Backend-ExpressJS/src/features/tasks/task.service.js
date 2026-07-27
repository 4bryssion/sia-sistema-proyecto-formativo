import { taskRepository } from './task.repository.js';

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
    return taskRepository.create(data);
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

    return taskRepository.update(id, data);
  },

  async toggle(id) {
    const record = await taskService.getById(id);
    return taskRepository.toggle(id, !record.isActive);
  },
};
