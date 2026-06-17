import prisma from '../../config/prisma.js';

export const authRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { userEmail: email },
      select: {
        id:           true,
        userEmail:    true,
        userPassword: true,
        userIsActive: true,
      },
    });
  },
};
