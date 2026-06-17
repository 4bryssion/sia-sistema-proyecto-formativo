import { taskRepository } from './task.repository.js';

export const taskService = {
  async getAll() {
    return taskRepository.findAll();
  },

  async getByUser(userId) {
    return taskRepository.findByUser(userId);
  },

  async getById(id) {
    const tarea = await taskRepository.findById(id);
    if (!tarea) throw new Error('Tarea no encontrada.');
    return tarea;
  },

  async create(bodyData) {
    const data = {
      ...bodyData,
      userId: Number(bodyData.userId),
    };
    return taskRepository.create(data);
  },

  async update(id, bodyData) {
    await taskService.getById(id);
    const data = { ...bodyData };
    if (data.userId) data.userId = Number(data.userId);
    return taskRepository.update(id, data);
  },

  async delete(id) {
    await taskService.getById(id);
    return taskRepository.delete(id);
  },
};
