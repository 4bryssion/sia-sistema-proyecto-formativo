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
    const endDate = new Date(bodyData.endDate);
    if (endDate < startOfToday()) {
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
      const endDate = new Date(data.endDate);
      const inicio = new Date(tarea.created_at);
      inicio.setHours(0, 0, 0, 0);
      if (endDate < inicio) {
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
