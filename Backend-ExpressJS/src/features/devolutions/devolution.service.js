import prisma from '../../config/prisma.js';
import { devolutionRepository } from './devolution.repository.js';
import { notify } from '../notifications/notification.service.js';

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
  async getAll(status) {
    return devolutionRepository.findAll(status);
  },

  async getById(id) {
    const request = await devolutionRepository.findById(id);
    if (!request) throw new Error('Devolución no encontrada.');
    return request;
  },

  // Fase 1 — registrar la devolución. No mueve stock ni cambia el estado del
  // préstamo: solo declara qué se está entregando.
  async create(bodyData, actorId) {
    const loanId = Number(bodyData.loanId);

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { materials: { include: { consumableMaterial: { include: { returnable: { select: { id: true } } } } } } },
    });
    if (!loan || !loan.isActive) throw new Error('El préstamo especificado no existe.');
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
    notify({
      title: `Devolución ${type.toLowerCase()} registrada`,
      description: recorta(
        `Préstamo #${loanId}. Entrega: ${nombreDe(created.requestedBy)}. Materiales: ${detalle}. Pendiente de autorizar.`,
      ),
      module: 'loan-returns',
      userId: actorId,
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

    const { request: autorizada, movimientos } = await devolutionRepository.authorize({
      requestId: request.id,
      loanId: request.loanId,
      authorizedById: actorId,
      plan,
    });

    const detalle = autorizada.items
      .map((i) => `${i.consumableMaterial.materialName} x${i.returnedQuantity} (${i.materialStatus})`)
      .join(', ');
    notify({
      title: `Devolución ${autorizada.type.toLowerCase()} autorizada`,
      description: recorta(
        `Préstamo #${autorizada.loanId}. Autoriza: ${nombreDe(autorizada.authorizedBy)}. `
        + `Entregó: ${nombreDe(autorizada.requestedBy)}. Materiales: ${detalle}.`,
      ),
      module: 'loan-returns',
      userId: actorId,
    });

    // Notificación aparte por cada material que devolvió cantidad al inventario:
    // el movimiento de stock es el dato que más se audita
    for (const m of movimientos) {
      if (m.estado !== 'Disponible' || m.antes == null) continue;
      notify({
        title: 'Stock reintegrado al inventario',
        description: recorta(
          `${m.materialName}: ${m.antes} → ${m.despues} unidades por la devolución del préstamo #${autorizada.loanId}.`,
        ),
        module: 'loan-returns',
        userId: actorId,
      });
    }

    // Los que no vuelven al stock también se registran, con su severidad
    for (const m of movimientos) {
      if (m.estado === 'Disponible') continue;
      notify({
        title: 'Material devuelto sin reintegrar al stock',
        description: recorta(
          `${m.materialName} quedó en estado ${m.estado} tras la devolución del préstamo #${autorizada.loanId}: su cantidad no vuelve al inventario.`,
        ),
        severity: m.estado === 'Baja' ? 'Critica' : 'Advertencia',
        module: 'loan-returns',
        userId: actorId,
      });
    }

    return autorizada;
  },

  async toggle(id) {
    const request = await devolutionService.getById(id);
    // Una devolución ya autorizada movió stock y liquidó parte del préstamo:
    // desactivarla no desharía nada de eso y dejaría el inventario mintiendo
    if (request.status === 'Autorizada') {
      throw new Error('No se puede desactivar una devolución ya autorizada.');
    }
    const updated = await devolutionRepository.toggle(id, !request.isActive);
    notify({
      title: request.isActive ? 'Devolución descartada' : 'Devolución reactivada',
      description: `La devolución #${id} del préstamo #${request.loanId} quedó ${request.isActive ? 'descartada' : 'de nuevo en espera'}.`,
      severity: 'Advertencia',
      module: 'loan-returns',
    });
    return updated;
  },
};
