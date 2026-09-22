import { notificationRepository } from './notification.repository.js';
import { accessService } from '../access/access.service.js';
import { getActorId } from '../../middleware/requestContext.js';

// (p50) Quién ve el panorama del sistema en vez de sus propias tareas.
//
// Es un PERMISO y no un nombre de grupo: así un grupo nuevo puede administrar
// notificaciones sin tocar código, y quitarle el permiso a alguien surte efecto
// en su siguiente petición y no cuando caduque su sesión. El seed se lo da a
// Administrador; SuperAdmin lo recibe junto con todos los demás.
const PERMISO_SISTEMA = 'list_system_notifications';

// (p50) Cuántos avisos ve un administrador. Es un panorama de lo último que
// pasó, no un histórico: para el histórico está la auditoría, que además guarda
// el valor anterior y el posterior de cada cambio.
export const MAX_ADMIN = 10;

export const notificationService = {
  /**
   * Las notificaciones de quien pregunta.
   *
   * Dos audiencias, dos consultas distintas:
   *   - administradores: los últimos préstamos y devoluciones del sistema,
   *   - cualquier otra persona: las tareas que le asignaron.
   *
   * Quién ve qué se decide AQUÍ y no en el frontend: si dependiera de la
   * pantalla, bastaría con llamar a la API a mano para ver lo que no toca.
   */
  async getForCurrentUser(userId) {
    const esAdmin = await accessService.hasPermission(userId, PERMISO_SISTEMA);
    return esAdmin
      ? notificationRepository.findForAdmins(MAX_ADMIN)
      : notificationRepository.findForRecipient(userId);
  },

  /** Enciende o apaga el punto verde de la campana. */
  async hayNuevas(userId) {
    const esAdmin = await accessService.hasPermission(userId, PERMISO_SISTEMA);
    const usuario = await notificationRepository.seenAt(userId);
    const nuevas = await notificationRepository.contarDesde({
      userId,
      esAdmin,
      desde: usuario?.notificationsSeenAt ?? null,
    });
    return { hayNuevas: nuevas > 0, nuevas };
  },

  /**
   * Marca el momento en que abrió las notificaciones.
   *
   * Se guarda la hora del servidor y no la que mande el navegador: un reloj
   * adelantado en un equipo apagaría el punto verde para avisos que aún no han
   * ocurrido.
   */
  async marcarVistas(userId) {
    await notificationRepository.marcarVistas(userId, new Date());
    return { hayNuevas: false, nuevas: 0 };
  },
};

/**
 * Registra un aviso PARA ALGUIEN.
 *
 * (p50) Solo la llaman tres sitios, y no debe llamarla ninguno más: préstamo
 * realizado, devolución solicitada y tarea asignada. Cualquier otro cambio del
 * sistema ya queda en `audit_log` por la extensión de Prisma, con más detalle
 * del que una notificación puede dar.
 *
 * `recipientId` ausente significa "para los administradores". El autor se toma
 * del contexto de la petición.
 *
 * Fire-and-forget: un fallo del aviso NUNCA debe romper la operación principal.
 */
export const notify = ({ title, description, severity = 'Informativa', module, recipientId = null }) =>
  notificationRepository
    .create({
      title,
      description,
      severity,
      module,
      userId: getActorId(),
      recipientId,
    })
    .catch((err) => console.error('Error registrando notificación:', err.message));
