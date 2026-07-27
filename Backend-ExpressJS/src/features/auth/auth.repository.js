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

  async resetPasswordTransaction(userId, hashedPassword, codeId) {
    return prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { userPassword: hashedPassword } }),
      prisma.passwordResetCode.update({ where: { id: codeId }, data: { used: true } }),
    ]);
  },
};
