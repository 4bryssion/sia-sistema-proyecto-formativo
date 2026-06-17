import prisma from '../../config/prisma.js';

const selectPublic = {
  id:                true,
  userFirstName:     true,
  userLastName:      true,
  userDocumentNumber: true,
  userEndDate:       true,
  userEmail:         true,
  userPhone:         true,
  userSecondPhone:   true,
  userAddress:       true,
  userStatus:        true, // cuenta habilitada (antes userIsActive)
  userIsActive:      true, // soft-delete (nuevo)
  userPhoto:         true,
  userAccountType:   true,
  createdAt:         true,
  updatedAt:         true,
  documentType: { select: { id: true, documentName: true } },
};

export const userRepository = {
  async findAll() {
    return prisma.user.findMany({
      where: { userIsActive: true },
      select: selectPublic,
      orderBy: { userFirstName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: selectPublic,
    });
  },

  async findByIdWithPassword(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data) {
    return prisma.user.create({
      data,
      select: selectPublic,
    });
  },

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: selectPublic,
    });
  },

  async toggle(id, isActive) {
    return prisma.user.update({
      where: { id },
      data: { userIsActive: isActive },
      select: selectPublic,
    });
  },
};
