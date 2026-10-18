import prisma from '../../config/prisma.js';
import { devolutionRepository } from './devolution.repository.js';
import { notify } from '../notifications/notification.service.js';
import { accessService } from '../access/access.service.js';
import { clausulaParticipacion, participaEnPrestamo } from '../../shared/participacionEnPrestamo.js';

// (p51) Quién ve las devoluciones de TODO el mundo. Sin este permiso solo se
// ven las de los préstamos propios (RFINV14).
const PERMISO_VER_TODAS = 'list_all_loan_returns';

const recorteSegunActor = async (actor) => {
  if (await accessService.hasPermission(actor.id, PERMISO_VER_TODAS)) return undefined;
  return clausulaParticipacion(actor);
};

// La descripción de una notificación es VARCHAR(255): se recorta antes de
// guardar para que un préstamo con muchos materiales no rompa el insert
const recorta = (texto, max = 255) =>
  texto.length <= max ? texto : `${texto.slice(0, max - 3)}...`;

const nombreDe = (usuario) =>
  usuario ? `${usuario.userFirstName} ${usuario.userLastName}` : 'Usuario desconocido';

// ¿Es material devolutivo? La herencia de tabla hace que un devolutivo sea una
// fila de consumable_materials con hermana en returnable_materials.
//
// El tipo decide CUÁNTO deja de estar pendiente al devolver:
// - Devolutivo: solo lo que se entrega. Si presta 3 y devuelve 1, quedan 2
//   pendientes y puede haber otra devolución después.
// - Consumible: la línea entera. Lo que no vuelve se gastó y no va a volver
//   nunca, así que dejarlo pendiente mantendría abierto un préstamo imposible
//   de cerrar.
const esDevolutivo = (material) => Boolean(material?.returnable);

// Lo que todavía debe volver de una línea del préstamo
const pendienteDe = (loanMaterial) =>
  loanMaterial.borrowedQuantity - loanMaterial.returnedQuantity;

export const devolutionService = {
  async getAll(status, actor) {
    return devolutionRepository.findAll(status, await recorteSegunActor(actor));
  },

  async getById(id, actor) {
    const request = await devolutionRepository.findById(id);
    if (!request) throw new Error('Devolución no encontrada.');

    // Mismo criterio que en préstamos: se responde como si no existiera, para
    // no confirmar con el id en la mano lo que no se puede ver.
    if (await accessService.hasPermission(actor.id, PERMISO_VER_TODAS)) return request;
    if (participaEnPrestamo(request.loan, actor)) return request;
    throw new Error('Devolución no encontrada.');
  },

  // Fase 1 — registrar la devolución. No mueve stock ni cambia el estado del
  // préstamo: solo declara qué se está entregando.
  async create(bodyData, actorId) {
    const loanId = Number(bodyData.loanId);

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        materials: { include: { consumableMaterial: { include: { returnable: { select: { id: true } } } } } },
        // (p51) Las firmas hacen falta para saber de quién es el préstamo.
        signatures: true,
      },
    });
    if (!loan || !loan.isActive) throw new Error('El préstamo especificado no existe.');

    // (p51) Devolver lo de otro. No se comprobaba: con `create_loan_return` y un
    // id de préstamo cualquiera —y los ids son consecutivos— se podía registrar
    // una devolución a nombre de un tercero. Quien puede ver los préstamos de
    // todos sigue pudiendo registrarla por cuenta ajena, que es el trabajo de
    // quien atiende el almacén; quien solo ve los suyos, solo los suyos.
    const puedeVerTodos = await accessService.hasPermission(actorId, 'list_all_loans');
    if (!puedeVerTodos && !participaEnPrestamo(loan, { id: actorId })) {
      throw new Error('El préstamo especificado no existe.');
    }
    if (loan.status !== 'Activo') {
      throw new Error(`Solo los préstamos en estado Activo admiten devoluciones. Estado actual: ${loan.status}.`);
    }

    const ids = bodyData.items.map((i) => Number(i.materialId));
    if (new Set(ids).size !== ids.length) {
      throw new Error('No se puede repetir el mismo material en una devolución.');
    }

    // Unidades ya comprometidas por otra devolución en espera: sin esto se
    // podrían registrar dos devoluciones de las mismas unidades y al autorizar
    // ambas el préstamo quedaría con más devuelto que prestado
    const enEspera = await devolutionRepository.findPendingByLoan(loanId);
    const comprometido = new Map();
    for (const solicitud of enEspera) {
      for (const item of solicitud.items) {
        comprometido.set(item.materialId, (comprometido.get(item.materialId) ?? 0) + item.returnedQuantity);
      }
    }

    const items = [];
    let liquidaTodo = true;

    for (const entrada of bodyData.items) {
      const materialId = Number(entrada.materialId);
      const loanMaterial = loan.materials.find((m) => m.materialId === materialId);
      if (!loanMaterial) throw new Error('Uno de los materiales no pertenece a este préstamo.');

      const material = loanMaterial.consumableMaterial;
      const pendiente = pendienteDe(loanMaterial) - (comprometido.get(materialId) ?? 0);
      if (pendiente <= 0) {
        throw new Error(`El material ${material.materialName} ya no tiene unidades pendientes de devolver.`);
      }

      const cantidad = Number(entrada.returnedQuantity);
      if (cantidad > pendiente) {
        throw new Error(`No se pueden devolver ${cantidad} unidades de ${material.materialName}: solo hay ${pendiente} pendientes.`);
      }
      // Un devolutivo tiene que volver: entregar 0 unidades no es una devolución.
      // En un consumible sí puede ser 0 (se gastó todo y no sobró nada).
      if (esDevolutivo(material) && cantidad < 1) {
        throw new Error(`Debe indicar cuántas unidades de ${material.materialName} se están devolviendo.`);
      }

      items.push({
        materialId,
        returnedQuantity: cantidad,
        requesterObservations: entrada.requesterObservations || '',
      });
    }

    // Total solo si NINGUNA línea del préstamo queda pendiente después de esto.
    // Se calcula aquí y no se acepta del cliente para que el estado que se
    // muestra ("En espera de autorizar devolución total") no pueda mentir.
    for (const loanMaterial of loan.materials) {
      const item = items.find((i) => i.materialId === loanMaterial.materialId);
      const seLiquida = item
        ? (esDevolutivo(loanMaterial.consumableMaterial) ? item.returnedQuantity : pendienteDe(loanMaterial))
        : 0;
      if (seLiquida < pendienteDe(loanMaterial)) {
        liquidaTodo = false;
        break;
      }
    }

    const type = liquidaTodo ? 'Total' : 'Parcial';
    const created = await devolutionRepository.create({ loanId, type, requestedById: actorId, items });

    const detalle = created.items
      .map((i) => `${i.consumableMaterial.materialName} x${i.returnedQuantity}`)
      .join(', ');
    // (p50) Único aviso de este módulo, y es el de la SOLICITUD, no el de la
    // autorización: la autorización la ejecuta el propio administrador, así que
    // avisarle de su propia acción no le dice nada. Lo que necesita saber es que
    // hay una devolución esperándolo.
    //
    // Sin destinatario: va al tablero de los administradores. `severity` es
    // Advertencia porque, a diferencia de un préstamo, esto pide que alguien
    // actúe.
    notify({
      title: `Devolución ${type.toLowerCase()} solicitada`,
      description: recorta(
        `Préstamo #${loanId}. Entrega: ${nombreDe(created.requestedBy)}. Materiales: ${detalle}. Pendiente de autorizar.`,
      ),
      severity: 'Advertencia',
      module: 'devolutions',
    });

    return created;
  },

  // Fase 2 — autorizar. Es la única operación que mueve inventario.
  async authorize(id, bodyData, actorId) {
    const request = await devolutionRepository.findById(id);
    if (!request || !request.isActive) throw new Error('Devolución no encontrada.');
    if (request.status !== 'En_espera') {
      throw new Error('Esta devolución ya fue autorizada.');
    }

    // Cada material devuelto necesita su estado: autorizar a medias dejaría
    // material sin destino y el préstamo con lo pendiente mal calculado
    const decisiones = new Map(bodyData.items.map((i) => [Number(i.id), i]));
    const faltantes = request.items.filter((i) => !decisiones.has(i.id));
    if (faltantes.length) {
      throw new Error('Debe indicar el estado de todos los materiales devueltos.');
    }

    const plan = request.items.map((item) => {
      const decision = decisiones.get(item.id);
      const loanMaterial = request.loan.materials.find((m) => m.materialId === item.materialId);
      const pendiente = loanMaterial ? pendienteDe(loanMaterial) : 0;

      // Consumible: se liquida toda la línea. Devolutivo: solo lo entregado.
      // El mínimo contra `pendiente` es defensivo: si algo cambió desde que se
      // registró, nunca se marca como devuelto más de lo que se prestó.
      const settled = Math.min(
        esDevolutivo(item.consumableMaterial) ? item.returnedQuantity : pendiente,
        pendiente,
      );

      return {
        itemId: item.id,
        materialId: item.materialId,
        materialStatus: decision.materialStatus,
        authorizerObservations: decision.authorizerObservations || '',
        requesterObservations: item.requesterObservations,
        settled,
        restoreQty: item.returnedQuantity,
      };
    });

    const { request: autorizada } = await devolutionRepository.authorize({
      requestId: request.id,
      loanId: request.loanId,
      authorizedById: actorId,
      plan,
    });

    // (p52) Autorizar NO genera avisos, y aqui habia dos bucles vacios y un
    // texto sin usar que decian lo contrario: el cuerpo se quedo sin escribir.
    // Se van los tres, porque un comentario que promete un aviso que no existe
    // es peor que no tener comentario. El criterio es el de p50: el unico aviso
    // del prestamo es el de su creacion; lo que pasa despues queda en
    // `audit_log`, que es donde se consulta un movimiento de stock.
    return autorizada;
  },

  // (p52) `actor` obligatorio, por lo mismo que en prestamos: `getById` recorta
  // por participacion y sin el actor reventaba. Descartar una devolucion no
  // funcionaba para ningun rol.
  async toggle(id, actor) {
    const request = await devolutionService.getById(id, actor);
    // Una devolución ya autorizada movió stock y liquidó parte del préstamo:
    // desactivarla no desharía nada de eso y dejaría el inventario mintiendo
    if (request.status === 'Autorizada') {
      throw new Error('No se puede desactivar una devolución ya autorizada.');
    }
    const updated = await devolutionRepository.toggle(id, !request.isActive);
    return updated;
  },
};
