import { taskRepository } from './task.repository.js';
import { notify } from '../notifications/notification.service.js';
import { vigilarEncargadosProtegidos } from '../access/access.service.js';

/**
 * (p51) Resumen del avance de una tarea.
 *
 * Una tarea con cinco encargados no tiene UN estado, tiene cinco. Las pantallas
 * necesitan igualmente una respuesta a "¿cómo va esta tarea?", y la respuesta es
 * el recuento. Se calcula aquí, una vez, y no en cada pantalla: la tabla, el
 * reporte y el modal de consulta tienen que decir lo mismo.
 */
const resumirAvance = (assignments = []) => {
  const total = assignments.length;
  const completadas = assignments.filter((a) => a.status === 'completada').length;
  const noCompletadas = assignments.filter((a) => a.status === 'no_completada').length;
  return {
    total,
    completadas,
    noCompletadas,
    enProgreso: total - completadas - noCompletadas,
    // El estado de la TAREA entera, derivado y sin inventar nombres nuevos:
    // reutiliza los tres del enum, que es lo que las pantallas ya saben traducir.
    //   - completada:    todos terminaron,
    //   - no_completada: nadie terminó y a todos se les pasó la fecha,
    //   - en_progreso:   cualquier otra combinación, incluida la mixta.
    estado:
      total === 0                ? 'en_progreso' :
      completadas === total      ? 'completada'  :
      noCompletadas === total    ? 'no_completada' :
                                   'en_progreso',
  };
};

/**
 * Lo que las pantallas reciben de cada tarea. Añade dos cosas derivadas:
 *   - `resumen`: el recuento de arriba,
 *   - `miAsignacion`: la del usuario que pregunta, o null si no la tiene.
 *
 * `miAsignacion` existe para que la casilla del listado no tenga que buscarla
 * entre las asignaciones en cada fila, y sobre todo para que no la busque mal:
 * con el recorte de "mis tareas" la lista solo trae una, pero en el listado
 * completo trae todas y la de quien mira es una cualquiera de ellas.
 */
const decorar = (tarea, actorId) => ({
  ...tarea,
  resumen: resumirAvance(tarea.assignments),
  miAsignacion: (tarea.assignments ?? []).find((a) => a.userId === Number(actorId)) ?? null,
});

export const taskService = {
  // (p50) `status` es el query param del listado: "active" | "inactive" | "all".
  // Es el estado del REGISTRO (activo/inactivo), no el de la tarea: el avance de
  // la tarea se filtra en la tabla, igual que el tipo de usuario en el listado
  // de usuarios.
  async getAll(status, actorId) {
    await taskRepository.markOverdue();          // aplica vencimiento antes de listar
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    const tareas = await taskRepository.findAll(filter);
    return tareas.map((t) => decorar(t, actorId));
  },

  async getByUser(userId, actorId = userId) {
    await taskRepository.markOverdue();
    const tareas = await taskRepository.findByUser(Number(userId));
    return tareas.map((t) => decorar(t, actorId));
  },

  async getById(id, actorId) {
    await taskRepository.markOverdue();
    const tarea = await taskRepository.findById(id);
    if (!tarea) throw new Error('Tarea no encontrada.');
    return decorar(tarea, actorId);
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

    // (p51) `userIds` llega siempre como lista, también cuando es una sola
    // persona: así no hay dos formas de crear una tarea. Se quitan los repetidos
    // porque el índice único los rechazaría con un error de base de datos, y
    // elegir dos veces a la misma persona en un select múltiple es un descuido
    // normal, no algo que deba romper el formulario.
    const userIds = [...new Set((bodyData.userIds ?? []).map(Number))];
    if (userIds.length === 0) throw new Error('Indique al menos un encargado para la tarea.');

    // (p51) A quien administra el sistema solo le asigna tareas un
    // superadministrador o alguien de su mismo grupo. La regla vive en accesos,
    // que es donde están las demás de «quién puede sobre quién».
    await vigilarEncargadosProtegidos(userIds);

    const { userIds: _, ...resto } = bodyData;
    const created = await taskRepository.create({ ...resto, endDate, userIds });

    // (p50) Único aviso de este módulo, y el único que tiene destinatario: le
    // llega a la persona asignada, no al tablero de administradores. Por eso el
    // texto está escrito PARA ella y no sobre ella.
    //
    // (p51) Un aviso por encargado. Con uno solo es exactamente el de antes; con
    // cinco, cada quien recibe el suyo —un aviso compartido no existe, y mandarlo
    // solo al primero dejaría a los otros cuatro sin enterarse.
    const limite = new Date(created.endDate).toLocaleDateString('es-CO', { timeZone: 'UTC' });
    for (const asignacion of created.assignments) {
      notify({
        title: 'Tarea asignada',
        description:
          `Se te asignó la tarea "${created.taskName}". Fecha límite: ${limite}.`,
        module: 'tasks',
        recipientId: asignacion.userId,
      });
    }
    return created;
  },

  async update(id, bodyData, actorId) {
    const tarea = await taskService.getById(id, actorId);
    const data = { ...bodyData };

    // isActive solo por PATCH /:id/toggle; `status` tampoco entra, porque el
    // estado es de cada asignación y cambiarlo se hace por PATCH /:id/status,
    // que sabe de quién es el que se toca.
    //
    // (p51) `userIds` SÍ entra: los encargados se pueden corregir al editar. El
    // repositorio reconcilia —a quien sigue no se le toca— para que cambiar el
    // título no le borre el avance a quien ya terminó.
    delete data.userId;
    delete data.isActive;
    delete data.status;

    // (p51) La misma regla que al crear, pero solo sobre quien ENTRA o SALE.
    // Vigilar la lista entera dejaría a un Instructor con `edit_task` sin poder
    // ni corregirle el título a una tarea que ya tenía un Administrador dentro:
    // lo que se vigila es el cambio, no el estado heredado.
    if (data.userIds !== undefined) {
      const quedan = [...new Set(data.userIds.map(Number))];
      const actuales = (tarea.assignments ?? []).map((a) => a.userId);
      const entran = quedan.filter((u) => !actuales.includes(u));
      const salen = actuales.filter((u) => !quedan.includes(u));
      await vigilarEncargadosProtegidos([...entran, ...salen]);
    }

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

  /**
   * (p50) Marcar una tarea propia como completada, o deshacerlo.
   *
   * Existe aparte de `update` porque el permiso es distinto: quien tiene la
   * tarea asignada puede decir si la hizo, pero no puede cambiarle el título,
   * la descripción ni la fecha límite. Con un solo endpoint habría que dar
   * `edit_task` a un aprendiz para que pudiera marcar su propia casilla.
   *
   * (p51) Ahora hay que decir de QUIÉN es el estado que se cambia. Sin
   * `objetivoId` se cambia el propio, que es el caso de siempre; con él se
   * cambia el de otra persona, y eso exige `edit_task`.
   *
   * @param {number} id             id de la tarea
   * @param {number} solicitanteId  quién pide el cambio
   * @param {string} status         'en_progreso' | 'completada'
   * @param {boolean} puedeEditarTodas  tiene `edit_task`
   * @param {number|undefined} objetivoId  de quién es el estado a cambiar
   */
  async setStatus(id, solicitanteId, status, puedeEditarTodas, objetivoId = undefined) {
    const tarea = await taskRepository.findById(id);
    if (!tarea) throw new Error('Tarea no encontrada.');

    const esOtraPersona = objetivoId !== undefined && Number(objetivoId) !== Number(solicitanteId);
    if (esOtraPersona && !puedeEditarTodas) {
      throw new Error('Solo puedes cambiar el estado de las tareas que tienes asignadas.');
    }

    const duenoId = Number(esOtraPersona ? objetivoId : solicitanteId);
    const asignacion = (tarea.assignments ?? []).find((a) => a.userId === duenoId);
    if (!asignacion) {
      // El mismo mensaje para "no es tuya" y "no está asignada a esa persona":
      // en los dos casos lo que falta es la asignación.
      throw new Error('Solo puedes cambiar el estado de las tareas que tienes asignadas.');
    }

    if (!tarea.isActive) {
      throw new Error('La tarea está inactiva: no se puede cambiar su estado.');
    }
    // `no_completada` no se pone ni se quita a mano: lo decide el vencimiento.
    // Una tarea vencida se queda vencida, y ese es justo el caso que la casilla
    // del listado muestra en gris.
    if (asignacion.status === 'no_completada') {
      throw new Error(
        `La tarea venció el ${new Date(tarea.endDate).toLocaleDateString('es-CO', { timeZone: 'UTC' })} `
        + 'sin completarse, así que su estado ya no puede cambiarse.',
      );
    }
    if (!['en_progreso', 'completada'].includes(status)) {
      throw new Error('Estado no válido: una tarea solo se marca como completada o en progreso.');
    }

    await taskRepository.setAssignmentStatus(asignacion.id, status);
    // Se devuelve la TAREA completa y no la asignación: la tabla necesita el
    // resumen recalculado para refrescar la fila, no solo la fila que cambió.
    return taskService.getById(id, solicitanteId);
  },

  async toggle(id, actorId) {
    const record = await taskRepository.findById(id);
    if (!record) throw new Error('Tarea no encontrada.');
    await taskRepository.toggle(id, !record.isActive);
    return taskService.getById(id, actorId);
  },
};
