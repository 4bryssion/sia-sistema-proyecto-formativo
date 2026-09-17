import prisma from '../../config/prisma.js';

export const authRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { userEmail: email },
      select: {
        id:           true,
        userEmail:    true,
        userPassword: true,
        isActive: true, // estado único: si es false, no puede iniciar sesión
        // Sesión única (p45): se leen aquí para decidir si ya hay una sesión viva
        activeSessionJti:       true,
        activeSessionExpiresAt: true,
        // (p48) Vigencia del vínculo: el login la comprueba después de las
        // credenciales. Una cuenta puede existir y ser correcta pero todavía no
        // estar habilitada, o haberlo dejado de estar.
        userStartDate:      true,
        userEndDate:        true,
        // (p48) Primer inicio de sesión: obliga a cambiar la contraseña temporal
        mustChangePassword: true,
      },
    });
  },

  // Sesión única (p45)
  async setActiveSession(userId, jti, expiresAt) {
    return prisma.user.update({
      where: { id: userId },
      data: { activeSessionJti: jti, activeSessionExpiresAt: expiresAt },
    });
  },

  async clearActiveSession(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { activeSessionJti: null, activeSessionExpiresAt: null },
    });
  },

  // Usado por authenticateToken en CADA petición protegida: solo trae lo mínimo
  // para contrastar el jti del token contra el de la sesión activa.
  async findSessionState(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        activeSessionJti: true,
        activeSessionExpiresAt: true,
        // (p48) Lo necesita authenticateToken para cerrar el paso al resto del
        // sistema mientras la contraseña temporal siga sin cambiarse
        mustChangePassword: true,
      },
    });
  },

  async invalidateActiveCodes(userId) {
    return prisma.passwordResetCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });
  },

  async createResetCode(userId, codeHash, expiresAt) {
    return prisma.passwordResetCode.create({ data: { userId, codeHash, expiresAt } });
  },

  async findActiveCodeByUserId(userId) {
    return prisma.passwordResetCode.findFirst({
      where: { userId, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async incrementAttempts(codeId) {
    return prisma.passwordResetCode.update({ where: { id: codeId }, data: { attempts: { increment: 1 } } });
  },

  async markCodeUsed(codeId) {
    return prisma.passwordResetCode.update({ where: { id: codeId }, data: { used: true } });
  },

  async findCodeById(id) {
    return prisma.passwordResetCode.findUnique({ where: { id } });
  },

  async setAttempts(codeId, attempts) {
    return prisma.passwordResetCode.update({ where: { id: codeId }, data: { attempts } });
  },

  // (p48) Contraseña actual + hash, para el cambio desde "Mi perfil". Se lee
  // aparte de findByEmail porque ahí se busca por correo y aquí por id de sesión.
  async findCredentialsById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true, userEmail: true, userPassword: true,
        userFirstName: true, userLastName: true, isActive: true,
      },
    });
  },

  // (p48) Cambio de contraseña desde "Mi perfil" o desde el primer inicio forzado.
  // NO toca la sesión activa: el usuario acaba de demostrar que conoce su
  // contraseña actual, así que echarlo sería una molestia sin ganancia de
  // seguridad. La recuperación por correo sí la cierra, porque quien la usa no
  // probó conocer la contraseña anterior.
  async changePassword(id, hashedPassword) {
    return prisma.user.update({
      where: { id },
      data: { userPassword: hashedPassword, mustChangePassword: false },
      select: { id: true },
    });
  },

  // (p48) Red de seguridad del login: si el vínculo venció y la tarea programada
  // no alcanzó a correr, se desactiva en el momento del intento de acceso.
  async deactivateExpiredUser(id) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false, activeSessionJti: null, activeSessionExpiresAt: null },
    });
  },

  async resetPasswordTransaction(userId, hashedPassword, codeId) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        // Cambiar la contraseña cierra la sesión activa (p45): es lo esperable por
        // seguridad y además es la vía de escape si alguien quedó bloqueado por el
        // "ya tienes una sesión iniciada" sin poder cerrarla.
        // (p48) mustChangePassword se limpia también aquí: si alguien nunca entró
        // y recuperó su contraseña por correo, ya eligió una propia y volver a
        // exigirle un cambio no protegería de nada.
        data: {
          userPassword: hashedPassword,
          mustChangePassword: false,
          activeSessionJti: null,
          activeSessionExpiresAt: null,
        },
      }),
      prisma.passwordResetCode.update({ where: { id: codeId }, data: { used: true } }),
    ]);
  },
};
