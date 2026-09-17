import prisma from '../../config/prisma.js';
import { applyLend, applyRestore } from './loan.stock.js';

const loanInclude = {
  // `returnable` se trae solo para saber de qué TIPO es cada material: la
  // herencia de tabla hace que un devolutivo sea un consumable_materials con
  // fila hermana en returnable_materials, y sin este dato el cliente no puede
  // distinguirlos (el formulario de préstamo y los retornos etiquetan por tipo).
  // Se pide solo el id para no arrastrar toda la fila.
  materials: {
    include: {
      consumableMaterial: {
        include: { returnable: { select: { id: true } } },
      },
    },
  },
  // (p48) `user: true` devolvía la fila COMPLETA del usuario en cada GET de
  // préstamos: hash de la contraseña, jti de la sesión activa, dirección y
  // teléfonos incluidos. Se cambia por un select explícito, que además es lo que
  // pide la vista: bajo el nombre del receptor van su tipo y número de documento.
  signatures: {
    include: {
      user: {
        select: {
          id: true,
          userFirstName: true,
          userLastName: true,
          userEmail: true,
          userDocumentNumber: true,
          userPhoto: true,
          documentType: { select: { id: true, documentName: true } },
        },
      },
    },
  },
};

export const loanRepository = {
  async findAll(status = 'active') {
    const where =
      status === 'all'      ? {} :
      status === 'inactive' ? { isActive: false } :
                              { isActive: true };
    return prisma.loan.findMany({ where, orderBy: { loanDate: 'desc' }, include: loanInclude });
  },

  async findById(id) {
    return prisma.loan.findUnique({ where: { id }, include: loanInclude });
  },

  // header: { apprenticeGroup, loanType, useJustification, returnDate }
  // materials: [{ materialId, borrowedQuantity }]
  // parties: { lenderId, receiverId, receiverEmail }
  //
  // (p48) El receptor puede no estar registrado: entonces su firma no apunta a
  // ningún usuario y el enlace viaja a `receiverEmail`. El prestador siempre es
  // un usuario del sistema (es cuentadante).
  async create({ header, materials, parties }) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({ data: header });

      await tx.loanMaterial.createMany({
        data: materials.map((m) => ({
          loanId: loan.id,
          materialId: m.materialId,
          borrowedQuantity: m.borrowedQuantity,
        })),
      });

      await tx.loanSignature.createMany({
        data: [
          { loanId: loan.id, userId: parties.lenderId, party: 'Prestador' },
          {
            loanId: loan.id,
            party: 'Receptor',
            userId: parties.receiverId ?? null,
            externalEmail: parties.receiverEmail ?? null,
          },
        ],
      });

      for (const m of materials) {
        const mat = await tx.consumableMaterial.findUnique({ where: { id: m.materialId } });
        await applyLend(tx, mat, m.borrowedQuantity);
      }

      return tx.loan.findUnique({ where: { id: loan.id }, include: loanInclude });
    });
  },

  // lines: [{ materialId, borrowedQuantity }] del préstamo (para restaurar/reaplicar)
  async toggle(id, isActive, lines) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.update({ where: { id }, data: { isActive } });
      for (const m of lines) {
        const mat = await tx.consumableMaterial.findUnique({ where: { id: m.materialId } });
        if (isActive) await applyLend(tx, mat, m.borrowedQuantity);
        else          await applyRestore(tx, mat, m.borrowedQuantity);
      }
      return tx.loan.findUnique({ where: { id }, include: loanInclude });
    });
  },

  // header: { apprenticeGroup, useJustification, returnDate, status? }
  // oldMaterials/newMaterials: [{ materialId, borrowedQuantity }]
  // parties: { lenderId, receiverId }
  async update(id, { header, oldMaterials, newMaterials, parties }) {
    return prisma.$transaction(async (tx) => {
      // 1) restaurar stock del set actual
      for (const m of oldMaterials) {
        const mat = await tx.consumableMaterial.findUnique({ where: { id: m.materialId } });
        await applyRestore(tx, mat, m.borrowedQuantity);
      }
      // 2) borrar líneas actuales y crear las nuevas
      await tx.loanMaterial.deleteMany({ where: { loanId: id } });
      await tx.loanMaterial.createMany({
        data: newMaterials.map((m) => ({
          loanId: id,
          materialId: m.materialId,
          borrowedQuantity: m.borrowedQuantity,
        })),
      });
      // 3) aplicar préstamo al set nuevo
      for (const m of newMaterials) {
        const mat = await tx.consumableMaterial.findUnique({ where: { id: m.materialId } });
        await applyLend(tx, mat, m.borrowedQuantity);
      }
      // 4) actualizar participantes (firmas)
      //
      // Editar solo se permite con el préstamo ya `Activo`, es decir, con las DOS
      // partes firmadas. Si se cambia de firmante, esa firma deja de ser válida:
      // la persona nueva no ha aceptado nada. Antes se reasignaba el usuario y se
      // conservaban `signed`/`signedAt`, así que el nuevo receptor aparecía como
      // "firmó el <fecha del anterior>" y nunca recibía el correo.
      //
      // Por eso se compara con lo que había: si la parte cambió, su firma se
      // reinicia y el préstamo vuelve a `Pendiente_confirmacion`, que es el
      // estado que el flujo de firma ya sabe resolver.
      const firmasPrevias = await tx.loanSignature.findMany({ where: { loanId: id } });
      const previa = (party) => firmasPrevias.find((f) => f.party === party);

      const cambio = (party, userId, email) => {
        const antes = previa(party);
        if (!antes) return true;
        return (antes.userId ?? null) !== (userId ?? null)
            || (antes.externalEmail ?? null) !== (email ?? null);
      };

      const cambioPrestador = cambio('Prestador', parties.lenderId, null);
      // (p48) Se escriben SIEMPRE los dos campos del receptor: editar un préstamo
      // para pasarlo de registrado a externo (o al revés) debe limpiar el que
      // deja de aplicar, o quedarían los dos puestos a la vez.
      const cambioReceptor = cambio('Receptor', parties.receiverId, parties.receiverEmail);

      const reinicio = { signed: false, signedAt: null };

      await tx.loanSignature.update({
        where: { loanId_party: { loanId: id, party: 'Prestador' } },
        data: { userId: parties.lenderId, ...(cambioPrestador ? reinicio : {}) },
      });
      await tx.loanSignature.update({
        where: { loanId_party: { loanId: id, party: 'Receptor' } },
        data: {
          userId: parties.receiverId ?? null,
          externalEmail: parties.receiverEmail ?? null,
          ...(cambioReceptor ? reinicio : {}),
        },
      });

      // 5) actualizar cabecera. Con una firma reiniciada el préstamo no puede
      // seguir `Activo`: eso significaría que las dos partes firmaron.
      const huboCambioDeParte = cambioPrestador || cambioReceptor;
      await tx.loan.update({
        where: { id },
        data: huboCambioDeParte ? { ...header, status: 'Pendiente_confirmacion' } : header,
      });

      return {
        loan: await tx.loan.findUnique({ where: { id }, include: loanInclude }),
        // Quién tiene que volver a firmar; el service usa esto para reenviar el
        // correo con el enlace
        partesReiniciadas: [
          ...(cambioPrestador ? ['Prestador'] : []),
          ...(cambioReceptor ? ['Receptor'] : []),
        ],
      };
    });
  },

  // Marca la firma de una parte; si ambas quedan firmadas, el préstamo pasa a Activo.
  async sign(loanId, party) {
    return prisma.$transaction(async (tx) => {
      await tx.loanSignature.update({
        where: { loanId_party: { loanId, party } },
        data: { signed: true, signedAt: new Date() },
      });
      const pending = await tx.loanSignature.count({ where: { loanId, signed: false } });
      if (pending === 0) {
        await tx.loan.update({ where: { id: loanId }, data: { status: 'Activo' } });
      }
      return tx.loan.findUnique({ where: { id: loanId }, include: loanInclude });
    });
  },
};
