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
      select: { id: true, isActive: true, activeSessionJti: true, activeSessionExpiresAt: true },
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

  async resetPasswordTransaction(userId, hashedPassword, codeId) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        // Cambiar la contraseña cierra la sesión activa (p45): es lo esperable por
        // seguridad y además es la vía de escape si alguien quedó bloqueado por el
        // "ya tienes una sesión iniciada" sin poder cerrarla.
        data: { userPassword: hashedPassword, activeSessionJti: null, activeSessionExpiresAt: null },
      }),
      prisma.passwordResetCode.update({ where: { id: codeId }, data: { used: true } }),
    ]);
  },
};
