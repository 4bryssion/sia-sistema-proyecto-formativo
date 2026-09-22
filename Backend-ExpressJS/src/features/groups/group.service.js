import { groupRepository } from './group.repository.js';
import { prepararNombre } from '../../shared/catalogName.js';
import { permissionRepository } from '../permissions/permission.repository.js';

export const groupService = {
  // Mismo contrato de `status` que marcas, inventarios y materiales:
  // active (por defecto) | inactive | all
  async getAll(status) {
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    return groupRepository.findAll(filter);
  },

  async getById(id) {
    const group = await groupRepository.findById(id);
    if (!group) throw new Error('Grupo no encontrado.');
    return group;
  },

  async create(data) {
    const { limpio, normalizado } = await prepararNombre({
      valor: data.groupName,
      buscar: groupRepository.findByNormalized,
      mensajeVacio: () => 'El nombre del grupo no puede quedar vacío.',
      mensajeChoque: (x) => `Ya existe un grupo registrado como «${x.groupName}». Usa ese o escribe un nombre distinto.`,
    });
    return groupRepository.create({ ...data, groupName: limpio, groupNameNormalized: normalizado });
  },

  async update(id, data) {
    await groupService.getById(id);
    // El nombre no es obligatorio en el PUT: si no viene, no se toca ni se
    // recalcula su forma normalizada.
    if (data.groupName === undefined) return groupRepository.update(id, data);

    const { limpio, normalizado } = await prepararNombre({
      valor: data.groupName,
      buscar: groupRepository.findByNormalized,
      idActual: id,
      mensajeVacio: () => 'El nombre del grupo no puede quedar vacío.',
      mensajeChoque: (x) => `Ya existe un grupo registrado como «${x.groupName}». Usa ese o escribe un nombre distinto.`,
    });
    return groupRepository.update(id, { ...data, groupName: limpio, groupNameNormalized: normalizado });
  },

  async toggle(id) {
    const record = await groupService.getById(id);
    return groupRepository.toggle(id, !record.isActive);
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

  // Estilo edward: lista los permisos del grupo (incluye permissionCodename)
  async getPermissions(groupId) {
    await groupService.getById(groupId);
    return groupRepository.getPermissionsByGroupId(groupId);
  },

  // Reemplazo atómico del set de permisos de un grupo
  async updatePermissions(groupId, permissionIds) {
    await groupService.getById(groupId);
    return groupRepository.updatePermissions(groupId, permissionIds);
  },
};
