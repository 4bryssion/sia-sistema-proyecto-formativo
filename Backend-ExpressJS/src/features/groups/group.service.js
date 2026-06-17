import { groupRepository } from './group.repository.js';
import { permissionRepository } from '../permissions/permission.repository.js';

export const groupService = {
  async getAll() {
    return groupRepository.findAll();
  },

  async getById(id) {
    const group = await groupRepository.findById(id);
    if (!group) throw new Error('Grupo no encontrado.');
    return group;
  },

  async create(data) {
    return groupRepository.create(data);
  },

  async update(id, data) {
    await groupService.getById(id);
    return groupRepository.update(id, data);
  },

  async delete(id) {
    await groupService.getById(id);
    return groupRepository.delete(id);
  },

  async assignPermission(groupId, permissionId) {
    await groupService.getById(groupId);

    const permission = await permissionRepository.findById(permissionId);
    if (!permission) throw new Error('Permiso no encontrado.');

    const alreadyAssigned = await groupRepository.hasPermission(groupId, permissionId);
    if (alreadyAssigned) throw new Error('El permiso ya está asignado a este grupo.');

    return groupRepository.assignPermission(groupId, permissionId);
  },

  async removePermission(groupId, permissionId) {
    await groupService.getById(groupId);

    const alreadyAssigned = await groupRepository.hasPermission(groupId, permissionId);
    if (!alreadyAssigned) throw new Error('El permiso no está asignado a este grupo.');

    return groupRepository.removePermission(groupId, permissionId);
  },
};
