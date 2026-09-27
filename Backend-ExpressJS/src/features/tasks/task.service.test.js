// Pruebas unitarias de taskService — Matriz de Casos de Prueba v6, módulo Tareas.
// Casos: 001-TAR, 002-TAR y 003-TAR. El repository y las notificaciones se
// simulan: no se toca la base de datos.
import { taskService } from './task.service.js';
import { taskRepository } from './task.repository.js';

jest.mock('./task.repository.js');
jest.mock('../notifications/notification.service.js');

describe('taskService', () => {
  test('001-TAR: create() rechaza una fecha de fin anterior a hoy sin crear la tarea', async () => {
    const payload = { userId: 5, taskName: 'Inventario semanal', description: 'Contar la bodega 1', endDate: '2020-01-01' };

    await expect(taskService.create(payload)).rejects.toThrow('La fecha de fin no puede ser anterior a hoy.');
    expect(taskRepository.create).not.toHaveBeenCalled();
  });

  test('002-TAR: update() rechaza una fecha de fin anterior a la fecha de creación de la tarea', async () => {
    taskRepository.markOverdue.mockResolvedValue({ count: 0 });
    taskRepository.findById.mockResolvedValue({
      id: 1, userId: 5, status: 'en_progreso', isActive: true,
      created_at: new Date('2026-06-01T15:00:00'),
      endDate: new Date('2026-07-01'),
    });

    await expect(taskService.update(1, { endDate: '2026-05-01' })).rejects.toThrow(
      'La fecha de fin no puede ser anterior a la fecha de inicio.',
    );
    expect(taskRepository.update).not.toHaveBeenCalled();
  });

  test('003-TAR: setStatus() no permite cambiar el estado de una tarea vencida (no_completada)', async () => {
    taskRepository.markOverdue.mockResolvedValue({ count: 0 });
    taskRepository.findById.mockResolvedValue({
      id: 3, userId: 5, status: 'no_completada', isActive: true,
      created_at: new Date('2026-06-01T15:00:00'),
      endDate: new Date('2026-06-10'),
    });

    await expect(taskService.setStatus(3, 5, 'completada', false)).rejects.toThrow(/venció el .* sin completarse/);
    expect(taskRepository.update).not.toHaveBeenCalled();
  });
});
