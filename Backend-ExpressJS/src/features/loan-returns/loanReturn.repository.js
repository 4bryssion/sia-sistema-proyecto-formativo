import prisma from '../../config/prisma.js';

const includeRelations = {
  loanMaterial: {
    select: {
      borrowedQuantity: true,
      loan: {
        select: {
          id: true, loanDate: true, returnDate: true, apprenticeGroup: true, useJustification: true,
          status: true,
          // (p52) Las firmas dicen quien participa en el prestamo, y son lo que
          // permite recortar este listado al que mira. Antes no venian y el
          // modulo devolvia los retornos de todo el mundo.
          signatures: { select: { userId: true, externalEmail: true } },
        },
      },
      consumableMaterial: {
        select: { id: true, materialName: true, status: true },
      },
    },
  },
};

export const loanReturnRepository = {
  // (p52) `participacion` llega ya construida desde el service y se aplica EN LA
  // CONSULTA, igual que en prestamos y devoluciones: filtrar despues de leer
  // dejaria los retornos ajenos al alcance de una llamada directa al API.
  async findAll(participacion = undefined) {
    return prisma.loanReturn.findMany({
      where: {
        isActive: true,
        ...(participacion ? { loanMaterial: { loan: { signatures: participacion } } } : {}),
      },
      include: includeRelations,
      orderBy: { returnDate: 'desc' },
    });
  },

  async findById(id) {
    return prisma.loanReturn.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  // data: { loanId, materialId, remainingQuantity, observations }
  // restore: { type: 'quantity', qty } | { type: 'serialized', status }
  async createWithRestore(data, restore) {
    return prisma.$transaction(async (tx) => {
      const loanReturn = await tx.loanReturn.create({ data, include: includeRelations });

      const material = await tx.consumableMaterial.findUnique({ where: { id: data.materialId } });
      if (restore.type === 'serialized') {
        // El estado elegido por el validador ES el nuevo estado del material (RFADMIN21).
        await tx.consumableMaterial.update({
          where: { id: material.id },
          data: { status: restore.status },
        });
      } else {
        // Reintegra SOLO el sobrante; si estaba En_prestamo y vuelve a haber stock → Disponible.
        const newQty = material.quantity + restore.qty;
        await tx.consumableMaterial.update({
          where: { id: material.id },
          data: {
            quantity: newQty,
            ...(material.status === 'En_prestamo' && newQty > 0 ? { status: 'Disponible' } : {}),
          },
        });
      }

      // Finalizar el préstamo si ya no quedan materiales sin retorno activo
      const totalLines = await tx.loanMaterial.count({ where: { loanId: data.loanId } });
      const returned = await tx.loanReturn.count({ where: { loanId: data.loanId, isActive: true } });
      if (returned === totalLines) {
        await tx.loan.update({ where: { id: data.loanId }, data: { status: 'Finalizado' } });
      }

      return loanReturn;
    });
  },

  // (p52) Desactivar un retorno DESHACE lo que el retorno hizo.
  //
  // Antes solo volteaba `isActive`: el `create` sumaba el sobrante al stock y el
  // toggle no lo restaba, asi que crear → desactivar → crear sumaba dos veces y
  // el inventario crecia sin tope. Ahora el movimiento se deshace dentro de la
  // misma transaccion que apaga la fila, asi que la pareja crear/desactivar es
  // neutra para el inventario.
  //
  // Solo se puede desactivar. Reactivar no se permite a proposito: el retorno de
  // un material serializado guarda el estado final en el MATERIAL y no en esta
  // fila, asi que al reactivarlo no hay forma de saber que estado se eligio, y
  // rehacerlo a medias dejaria el inventario mintiendo. Para rehacerlo se
  // registra el retorno otra vez, que si tiene todos los datos.
  async desactivar(id) {
    return prisma.$transaction(async (tx) => {
      const retorno = await tx.loanReturn.findUnique({ where: { id }, include: includeRelations });
      const material = await tx.consumableMaterial.findUnique({ where: { id: retorno.materialId } });

      if (retorno.remainingQuantity != null && material?.quantity != null) {
        const nueva = material.quantity - retorno.remainingQuantity;
        if (nueva < 0) {
          throw new Error(
            'No se puede desactivar el retorno: el sobrante que reintegro ya no esta en el inventario.',
          );
        }
        await tx.consumableMaterial.update({
          where: { id: material.id },
          data: {
            quantity: nueva,
            // Si al quitar el sobrante no queda nada, el material vuelve a estar
            // todo fuera: es el estado que tenia antes del retorno.
            ...(nueva === 0 && material.status === 'Disponible' ? { status: 'En_prestamo' } : {}),
          },
        });
      }

      const actualizado = await tx.loanReturn.update({
        where: { id },
        data: { isActive: false },
        include: includeRelations,
      });

      // El prestamo se habia marcado Finalizado cuando todas sus lineas tenian
      // retorno activo. Si una deja de tenerlo, vuelve a estar en curso.
      const totalLineas = await tx.loanMaterial.count({ where: { loanId: retorno.loanId } });
      const conRetorno = await tx.loanReturn.count({ where: { loanId: retorno.loanId, isActive: true } });
      if (conRetorno < totalLineas) {
        const prestamo = await tx.loan.findUnique({ where: { id: retorno.loanId }, select: { status: true } });
        if (prestamo?.status === 'Finalizado') {
          await tx.loan.update({ where: { id: retorno.loanId }, data: { status: 'Activo' } });
        }
      }

      return actualizado;
    });
  },
};
