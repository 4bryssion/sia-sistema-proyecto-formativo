import prisma from '../../config/prisma.js';
import { applyRestore } from '../loans/loan.stock.js';

// Quien entrega y quien autoriza se exponen con nombre, no con el usuario
// completo: la pantalla solo necesita mostrarlos
const userSelect = { select: { id: true, userFirstName: true, userLastName: true } };

const devolutionInclude = {
  requestedBy: userSelect,
  authorizedBy: userSelect,
  items: {
    include: {
      consumableMaterial: {
        // `returnable` distingue el tipo de material: es lo que decide si la
        // devolución liquida toda la línea (consumible) o solo lo entregado
        // (devolutivo). Solo el id, para no arrastrar la fila entera.
        include: { returnable: { select: { id: true } } },
      },
    },
  },
  loan: {
    include: {
      materials: { include: { consumableMaterial: { include: { returnable: { select: { id: true } } } } } },
      signatures: { include: { user: userSelect } },
    },
  },
};

export const devolutionRepository = {
  async findAll(status = 'active') {
    const where =
      status === 'all'      ? {} :
      status === 'inactive' ? { isActive: false } :
                              { isActive: true };
    return prisma.devolutionRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: devolutionInclude,
    });
  },

  async findById(id) {
    return prisma.devolutionRequest.findUnique({ where: { id }, include: devolutionInclude });
  },

  async create({ loanId, type, requestedById, items }) {
    return prisma.devolutionRequest.create({
      data: {
        loanId,
        type,
        requestedById,
        items: { create: items },
      },
      include: devolutionInclude,
    });
  },

  // Autorización (fase 2). Todo en una transacción porque son tres efectos que
  // no pueden quedar a medias: el estado del material, lo pendiente del préstamo
  // y el cierre de la solicitud.
  //
  // `plan` lo arma el service: por cada item trae qué estado se le pone al
  // material, cuánto deja de estar pendiente (`settled`) y cuánto vuelve al
  // stock (`restoreQty`).
  async authorize({ requestId, loanId, authorizedById, plan }) {
    // Cambios de stock, para que el service pueda notificar el antes y el después
    const movimientos = [];

    await prisma.$transaction(async (tx) => {
      for (const item of plan) {
        await tx.devolutionRequestItem.update({
          where: { id: item.itemId },
          data: {
            materialStatus: item.materialStatus,
            authorizerObservations: item.authorizerObservations,
          },
        });

        // Lo que deja de estar pendiente en el préstamo original
        await tx.loanMaterial.update({
          where: { loanId_materialId: { loanId, materialId: item.materialId } },
          data: { returnedQuantity: { increment: item.settled } },
        });

        // Snapshot fresco DENTRO de la transacción: entre el cálculo del service
        // y este punto el material pudo cambiar por otra operación
        const material = await tx.consumableMaterial.findUnique({ where: { id: item.materialId } });

        if (item.materialStatus === 'Disponible') {
          // Único caso que devuelve cantidad al inventario
          await applyRestore(tx, material, item.restoreQty);
          movimientos.push({
            materialId: material.id,
            materialName: material.materialName,
            antes: material.quantity,
            despues: material.quantity == null ? null : material.quantity + item.restoreQty,
            estado: 'Disponible',
          });
        } else {
          // Mantenimiento, Baja, Traslado o No disponible: solo cambia el estado.
          // La cantidad NO se reintegra (el material no vuelve a estar prestable).
          await tx.consumableMaterial.update({
            where: { id: material.id },
            data: { status: item.materialStatus },
          });
          movimientos.push({
            materialId: material.id,
            materialName: material.materialName,
            antes: material.quantity,
            despues: material.quantity,
            estado: item.materialStatus,
          });
        }

        // Registro histórico en loan_returns, la tabla que los requerimientos
        // nombran para los retornos (RFADMIN21/22)
        await tx.loanReturn.create({
          data: {
            loanId,
            materialId: item.materialId,
            remainingQuantity: item.restoreQty,
            observations: item.authorizerObservations || item.requesterObservations || '',
          },
        });
      }

      await tx.devolutionRequest.update({
        where: { id: requestId },
        data: { status: 'Autorizada', authorizedById, authorizedAt: new Date() },
      });

      // El préstamo pasa a Finalizado solo cuando ya no queda nada pendiente.
      // Mientras quede algo, sigue Activo con la información actualizada.
      const pendientes = await tx.loanMaterial.findMany({ where: { loanId } });
      const todoDevuelto = pendientes.every((m) => m.returnedQuantity >= m.borrowedQuantity);
      if (todoDevuelto) {
        await tx.loan.update({ where: { id: loanId }, data: { status: 'Finalizado' } });
      }
    });

    const request = await prisma.devolutionRequest.findUnique({
      where: { id: requestId },
      include: devolutionInclude,
    });

    return { request, movimientos };
  },

  async toggle(id, isActive) {
    return prisma.devolutionRequest.update({
      where: { id },
      data: { isActive },
      include: devolutionInclude,
    });
  },

  // Solicitudes en espera que ya comprometen materiales de este préstamo: sirven
  // para no registrar dos devoluciones sobre las mismas unidades
  async findPendingByLoan(loanId) {
    return prisma.devolutionRequest.findMany({
      where: { loanId, status: 'En_espera', isActive: true },
      include: { items: true },
    });
  },
};
