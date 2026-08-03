import { accessRepository } from './access.repository.js';
import { userRepository } from '../users/user.repository.js';
import { groupRepository } from '../groups/group.repository.js';
import { permissionRepository } from '../permissions/permission.repository.js';

export const accessService = {
  async getUserGroups(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado.');
    return accessRepository.getUserGroups(userId);
  },

  async assignGroup(userId, groupId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado.');

    const group = await groupRepository.findById(groupId);
    if (!group) throw new Error('Grupo no encontrado.');

    const alreadyAssigned = await accessRepository.hasGroup(userId, groupId);
    if (alreadyAssigned) throw new Error('El usuario ya pertenece a este grupo.');

    return accessRepository.assignGroup(userId, groupId);
  },

  async removeGroup(userId, groupId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado.');

    const alreadyAssigned = await accessRepository.hasGroup(userId, groupId);
    if (!alreadyAssigned) throw new Error('El usuario no pertenece a este grupo.');

    return accessRepository.removeGroup(userId, groupId);
  },

  async getUserPermissions(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado.');
    return accessRepository.getUserPermissions(userId);
  },

  async assignPermission(userId, permissionId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado.');

    const permission = await permissionRepository.findById(permissionId);
    if (!permission) throw new Error('Permiso no encontrado.');

    const alreadyAssigned = await accessRepository.hasPermission(userId, permissionId);
    if (alreadyAssigned) throw new Error('El usuario ya tiene este permiso directo.');

    return accessRepository.assignPermission(userId, permissionId);
  },

  async removePermission(userId, permissionId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado.');

    const alreadyAssigned = await accessRepository.hasPermission(userId, permissionId);
    if (!alreadyAssigned) throw new Error('El usuario no tiene este permiso directo.');

    return accessRepository.removePermission(userId, permissionId);
  },

  // Permisos efectivos del usuario autenticado (RBAC dinámico): el frontend los
  // consulta una vez al entrar y de ahí sale todo el gating de la UI.
  // isSuperUser ⇒ se devuelve el catálogo completo (acceso total por diseño).
  async getEffectivePermissions(userId) {
    if (await accessRepository.isSuperUser(userId)) {
      return accessRepository.getAllPermissionCodenames();
    }
    return accessRepository.getUserPermissionCodenames(userId);
  },

  // Estilo edward: SuperAdmin tiene todos los permisos; el resto por UNION directos+grupos
  async hasPermission(userId, permissionCode) {
    if (await accessRepository.isSuperUser(userId)) return true;
    const permissions = await accessRepository.getUserPermissionCodenames(userId);
    return permissions.includes(permissionCode);
  },
};
