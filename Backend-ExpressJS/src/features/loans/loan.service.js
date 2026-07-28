import jwt from 'jsonwebtoken';
import { loanRepository } from './loan.repository.js';
import prisma from '../../config/prisma.js';
import { checkAvailability } from './loan.stock.js';
import { sendLoanSignatureRequest } from '../../config/mailer.js';
import { notify } from '../notifications/notification.service.js';

const SIGN_TOKEN_TTL = '7d';

const assertUniqueMaterials = (materials) => {
  const ids = materials.map((m) => m.materialId);
  if (new Set(ids).size !== ids.length) {
    throw new Error('No se puede repetir el mismo material en un préstamo.');
  }
};

const verifySignToken = (token) => {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error('Enlace de firma inválido o expirado.');
  }
  if (payload.purpose !== 'loan_signature') throw new Error('Enlace de firma inválido o expirado.');
  return payload;
};

// Envía (o reenvía) el correo de firma a las firmas indicadas (por defecto, todas). Fire-and-forget:
// no bloquea al caller ni propaga errores de envío (mismo criterio que forgot-password).
const sendSignatureEmails = (loan, signatures = loan.signatures) => {
  for (const s of signatures) {
    const token = jwt.sign(
      { loanId: loan.id, party: s.party, purpose: 'loan_signature' },
      process.env.JWT_SECRET,
      { expiresIn: SIGN_TOKEN_TTL },
    );
    const signUrl = `${process.env.FRONTEND_URL}/loans/sign?token=${token}`;
    sendLoanSignatureRequest(s.user.userEmail, { partyLabel: s.party, loan, signUrl }).catch((e) => {
      console.error('Error enviando correos de firma:', e.message);
    });
  }
};

export const loanService = {
  async getAll(status) {
    return loanRepository.findAll(status);
  },

  async getById(id) {
    const loan = await loanRepository.findById(id);
    if (!loan) throw new Error('Préstamo no encontrado.');
    return loan;
  },

  async create(data) {
    assertUniqueMaterials(data.materials);
    for (const m of data.materials) {
      const material = await prisma.consumableMaterial.findUnique({ where: { id: m.materialId } });
      if (!material) throw new Error(`El material ${m.materialId} no existe.`);
      const err = checkAvailability(material, m.borrowedQuantity, 0);
      if (err) throw new Error(err);
    }
    const loan = await loanRepository.create({
      header: {
        apprenticeGroup: data.apprenticeGroup,
        useJustification: data.useJustification,
        returnDate: new Date(data.returnDate),
      },
      materials: data.materials,
      parties: { lenderId: data.lenderId, receiverId: data.receiverId },
    });
    sendSignatureEmails(loan); // fire-and-forget: no bloquea la respuesta de creación
    // (P43) Log del sistema
    notify({
      title: 'Préstamo creado',
      description: `Préstamo #${loan.id} creado para el grupo ${loan.apprenticeGroup} (pendiente de firmas).`,
      severity: 'Informativa',
      module: 'loans',
      userId: data.lenderId,
    });
    return loan;
  },

  async toggle(id) {
    const loan = await loanService.getById(id);
    // Con retornos ya reintegrados, restaurar/reaplicar stock a ciegas duplicaría el stock.
    const hasReturns = await prisma.loanReturn.findFirst({ where: { loanId: id, isActive: true } });
    if (hasReturns) throw new Error('No se puede desactivar/reactivar un préstamo con devoluciones registradas.');
    const lines = loan.materials.map((lm) => ({
      materialId: lm.materialId,
      borrowedQuantity: lm.borrowedQuantity,
    }));
    // Reactivar exige stock disponible para volver a prestar
    if (!loan.isActive) {
      for (const lm of loan.materials) {
        const material = await prisma.consumableMaterial.findUnique({ where: { id: lm.materialId } });
        const err = checkAvailability(material, lm.borrowedQuantity, 0);
        if (err) throw new Error(err);
      }
    }
    return loanRepository.toggle(id, !loan.isActive, lines);
  },

  async update(id, data) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { materials: { include: { loanReturns: true } } },
    });
    if (!loan) throw new Error('Préstamo no encontrado.');
    if (loan.status !== 'Activo') {
      throw new Error('Solo los préstamos en estado Activo pueden actualizarse.');
    }
    if (loan.materials.some((lm) => lm.loanReturns && lm.loanReturns.length > 0)) {
      throw new Error('No se puede editar un préstamo con devoluciones registradas.');
    }

    assertUniqueMaterials(data.materials);

    const ownedMap = new Map(loan.materials.map((lm) => [lm.materialId, lm.borrowedQuantity]));
    for (const m of data.materials) {
      const material = await prisma.consumableMaterial.findUnique({ where: { id: m.materialId } });
      if (!material) throw new Error(`El material ${m.materialId} no existe.`);
      const owned = ownedMap.get(m.materialId) ?? 0;
      const err = checkAvailability(material, m.borrowedQuantity, owned);
      if (err) throw new Error(err);
    }

    return loanRepository.update(id, {
      header: {
        apprenticeGroup: data.apprenticeGroup,
        useJustification: data.useJustification,
        returnDate: new Date(data.returnDate),
        ...(data.status ? { status: data.status } : {}),
      },
      oldMaterials: loan.materials.map((lm) => ({
        materialId: lm.materialId,
        borrowedQuantity: lm.borrowedQuantity,
      })),
      newMaterials: data.materials,
      parties: { lenderId: data.lenderId, receiverId: data.receiverId },
    });
  },

  async getSignatureInfo(token) {
    const payload = verifySignToken(token);
    const loan = await loanRepository.findById(payload.loanId);
    if (!loan) throw new Error('Préstamo no encontrado.');
    const signature = loan.signatures.find((s) => s.party === payload.party);
    // Resumen seguro para pantalla pública (no exponer el objeto user completo)
    return {
      loanId: loan.id, status: loan.status, party: payload.party,
      alreadySigned: signature.signed,
      apprenticeGroup: loan.apprenticeGroup, useJustification: loan.useJustification,
      loanDate: loan.loanDate, returnDate: loan.returnDate,
      materials: loan.materials.map((m) => ({
        materialName: m.consumableMaterial.materialName, borrowedQuantity: m.borrowedQuantity,
      })),
      signerName: `${signature.user.userFirstName} ${signature.user.userLastName}`,
    };
  },

  async sign(token) {
    const payload = verifySignToken(token);
    const loan = await loanRepository.findById(payload.loanId);
    if (!loan) throw new Error('Préstamo no encontrado.');
    if (loan.status !== 'Pendiente_confirmacion') {
      throw new Error(`Este préstamo ya no está pendiente de firma (estado: ${loan.status}).`);
    }
    const signature = loan.signatures.find((s) => s.party === payload.party);
    if (signature.signed) throw new Error('Esta parte ya firmó el préstamo.');

    return loanRepository.sign(loan.id, payload.party); // marca firma y activa si ambas
  },

  async resendSignatures(id) {
    const loan = await loanService.getById(id);
    if (loan.status !== 'Pendiente_confirmacion') {
      throw new Error('Solo se pueden reenviar correos de préstamos pendientes de firma.');
    }
    const pending = loan.signatures.filter((s) => !s.signed);
    sendSignatureEmails(loan, pending);
  },
};
