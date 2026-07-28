import { notificationRepository } from './notification.repository.js';

export const notificationService = {
  async getAll() {
    return notificationRepository.findAll();
  },

  async getById(id) {
    const record = await notificationRepository.findById(id);
    if (!record) throw new Error('Notificación no encontrada.');
    return record;
  },
};

// Helper interno para que otros services registren eventos del sistema.
// Fire-and-forget: un fallo del log NUNCA debe romper la operación principal.
export const notify = ({ title, description, severity = 'Informativa', module, userId = null }) =>
  notificationRepository
    .create({ title, description, severity, module, userId })
    .catch((err) => console.error('Error registrando notificación:', err.message));
