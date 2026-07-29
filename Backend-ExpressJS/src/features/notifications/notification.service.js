import { notificationRepository } from './notification.repository.js';
import { getActorId } from '../../middleware/requestContext.js';

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
// El autor (userId) se toma automáticamente del contexto de la petición: siempre
// queda registrado QUIÉN ejecutó la acción. Se puede sobrescribir con `userId`.
// Fire-and-forget: un fallo del log NUNCA debe romper la operación principal.
export const notify = ({ title, description, severity = 'Informativa', module, userId }) =>
  notificationRepository
    .create({
      title,
      description,
      severity,
      module,
      userId: userId ?? getActorId(),
    })
    .catch((err) => console.error('Error registrando notificación:', err.message));
