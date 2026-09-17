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

// (p48) El receptor externo debe ser alguien que NO está en el sistema: si su
// correo ya pertenece a un usuario, lo correcto es elegirlo del select y no
// escribirlo a mano, porque así el préstamo queda ligado a su ficha y su firma
// aparece en su historial.
//
// También se comprueba que el correo externo no sea el del propio prestador, que
// es el equivalente al `receiverId !== lenderId` que ya hace el validador.
// Devuelve el correo tal como debe compararse y guardarse. `Joi.string().lowercase()`
// es una regla de CONVERSIÓN: no falla con mayúsculas, devuelve el valor convertido
// en `value`… que el middleware `validate` descarta. Sin normalizar aquí, escribir
// "Juan@Sena.edu.co" se saltaba entero el aviso de "ese correo ya está registrado"
// (la búsqueda en Postgres distingue mayúsculas) y quedaba guardado así.
export const normalizarCorreo = (correo) =>
  typeof correo === 'string' ? correo.trim().toLowerCase() : correo;

const assertReceptorValido = async ({ receiverEmail, lenderId }) => {
  if (!receiverEmail) return;

  const registrado = await prisma.user.findUnique({
    where: { userEmail: normalizarCorreo(receiverEmail) },
    select: { id: true, userFirstName: true, userLastName: true },
  });
  if (registrado) {
    throw new Error(
      `Ese correo ya pertenece a ${registrado.userFirstName} ${registrado.userLastName}, ` +
      'que sí está registrado: selecciónalo en la lista de usuarios en vez de escribir su correo.',
    );
  }

  const prestador = await prisma.user.findUnique({
    where: { id: lenderId },
    select: { userEmail: true, userEmailInstitutional: true },
  });
  const correo = normalizarCorreo(receiverEmail);
  if (prestador && (correo === normalizarCorreo(prestador.userEmail) || correo === normalizarCorreo(prestador.userEmailInstitutional))) {
    throw new Error('El receptor debe ser distinto del prestador.');
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
// (p48) A dónde va el enlace de firma y con qué nombre se saluda.
// El receptor externo no tiene fila de usuario: su correo está en la propia firma
// y el saludo usa la dirección, que es lo único que se sabe de él.
const destinoDe = (firma) => firma.user?.userEmail ?? firma.externalEmail;
const nombreDe = (firma) =>
  firma?.user ? `${firma.user.userFirstName} ${firma.user.userLastName}` : (firma?.externalEmail ?? null);

const sendSignatureEmails = (loan, signatures = loan.signatures) => {
  for (const s of signatures) {
    const token = jwt.sign(
      { loanId: loan.id, party: s.party, purpose: 'loan_signature' },
      process.env.JWT_SECRET,
      { expiresIn: SIGN_TOKEN_TTL },
    );
    const signUrl = `${process.env.FRONTEND_URL}/loans/sign?token=${token}`;

    // La otra parte del préstamo: el correo debe decir frente a quién se firma
    const otra = (loan.signatures ?? []).find((x) => x.party !== s.party);

    const destino = destinoDe(s);
    // Sin destino no hay a quién escribir. No debería ocurrir (el validador exige
    // usuario o correo), pero un préstamo anterior a p48 mal migrado rompería el
    // bucle entero y con él la creación de los demás correos.
    if (!destino) {
      console.error(`Firma sin destinatario en el préstamo ${loan.id} (parte ${s.party}).`);
      continue;
    }

    sendLoanSignatureRequest(destino, {
      partyLabel: s.party,
      signerName: nombreDe(s),
      counterpartLabel: otra?.party,
      counterpartName: nombreDe(otra),
      loan,
      signUrl,
    }).catch((e) => {
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
    // El correo se normaliza ANTES de validarlo y de guardarlo, para que la
    // comprobación y lo que queda en BD hablen del mismo valor
    if (data.receiverEmail) data.receiverEmail = normalizarCorreo(data.receiverEmail);
    await assertReceptorValido(data);
    for (const m of data.materials) {
      const material = await prisma.consumableMaterial.findUnique({ where: { id: m.materialId } });
      if (!material) throw new Error(`El material ${m.materialId} no existe.`);
      const err = checkAvailability(material, m.borrowedQuantity, 0);
      if (err) throw new Error(err);
    }
    const loan = await loanRepository.create({
      header: {
        // (p48) El grupo es opcional: '' del formulario debe viajar como null, no
        // como 0, o el préstamo diría que pertenece al grupo cero
        apprenticeGroup: data.apprenticeGroup ? Number(data.apprenticeGroup) : null,
        loanType: data.loanType,
        useJustification: data.useJustification,
        returnDate: new Date(data.returnDate),
      },
      materials: data.materials,
      parties: {
        lenderId: data.lenderId,
        receiverId: data.receiverId,
        receiverEmail: data.receiverEmail,
      },
    });
    sendSignatureEmails(loan); // fire-and-forget: no bloquea la respuesta de creación
    // (P43) Log del sistema
    notify({
      title: 'Préstamo creado',
      description:
        `Préstamo #${loan.id} (${loan.loanType.toLowerCase()}) creado` +
        `${loan.apprenticeGroup ? ` para el grupo ${loan.apprenticeGroup}` : ''} (pendiente de firmas).`,
      severity: 'Informativa',
      module: 'loans',
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
    const toggled= await loanRepository.toggle(id, !loan.isActive, lines);
    notify({
      title: toggled.isActive ? 'Préstamo reactivado' : 'Préstamo desactivado',
      description: `Préstamo #${id} ${toggled.isActive ? 'reactivado (stock descontado nuevamente)' : 'desactivado (stock restaurado)'}.`,
      severity: toggled.isActive ? 'Informativa' : 'Advertencia',
      module: 'loans',
    });
    return toggled;
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
    if (data.receiverEmail) data.receiverEmail = normalizarCorreo(data.receiverEmail);
    await assertReceptorValido(data);

    const ownedMap = new Map(loan.materials.map((lm) => [lm.materialId, lm.borrowedQuantity]));
    for (const m of data.materials) {
      const material = await prisma.consumableMaterial.findUnique({ where: { id: m.materialId } });
      if (!material) throw new Error(`El material ${m.materialId} no existe.`);
      const owned = ownedMap.get(m.materialId) ?? 0;
      const err = checkAvailability(material, m.borrowedQuantity, owned);
      if (err) throw new Error(err);
    }

    const { loan: updated, partesReiniciadas } = await loanRepository.update(id, {
      header: {
        apprenticeGroup: data.apprenticeGroup ? Number(data.apprenticeGroup) : null,
        loanType: data.loanType,
        useJustification: data.useJustification,
        returnDate: new Date(data.returnDate),
        ...(data.status ? { status: data.status } : {}),
      },
      oldMaterials: loan.materials.map((lm) => ({
        materialId: lm.materialId,
        borrowedQuantity: lm.borrowedQuantity,
      })),
      newMaterials: data.materials,
      parties: {
        lenderId: data.lenderId,
        receiverId: data.receiverId,
        receiverEmail: data.receiverEmail,
      },
    });

    // (p48) Si cambió alguno de los firmantes, su firma se reinició y el
    // préstamo volvió a `Pendiente_confirmacion`: hay que mandarle el enlace a
    // quien ahora tiene que firmar. Fire-and-forget, igual que al crear: un
    // fallo de correo no deshace una edición ya guardada.
    if (partesReiniciadas.length) {
      sendSignatureEmails(
        updated,
        (updated.signatures ?? []).filter((s) => partesReiniciadas.includes(s.party)),
      );
    }

    // (P43) Log: modificación del préstamo (incluye materiales/cantidades nuevas)
    const detalle = data.materials
      .map((m) => `material #${m.materialId} x${m.borrowedQuantity}`)
      .join(', ');
    notify({
      title: 'Préstamo modificado',
      description:
        `Préstamo #${id} actualizado. Materiales: ${detalle}.` +
        (partesReiniciadas.length
          ? ` Cambió ${partesReiniciadas.join(' y ').toLowerCase()}: el préstamo vuelve a pendiente de confirmación y se reenvió el enlace de firma.`
          : ''),
      module: 'loans',
    });
    return updated;
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
      // (p48) Un receptor externo no tiene usuario: se saluda con su correo, que
      // es lo único que se sabe de él. Sin esto la pantalla pública de firma
      // reventaba al leer `signature.user.userFirstName` de un null.
      signerName: nombreDe(signature),
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
