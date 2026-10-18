import { groupRepository } from './group.repository.js';
import { prepararNombre } from '../../shared/catalogName.js';
import { permissionRepository } from '../permissions/permission.repository.js';
import { SUPERADMIN_GROUP } from '../../config/systemIdentities.js';
import { vigilarPermisosRestringidos } from '../access/access.service.js';

// ---- Protecciones de los roles (reglas de negocio del Excel) ----
//
// Ninguna estaba implementada, y sin ellas dar `toggle_group` al Administrador
// era entregarle la llave para dejar fuera al superadministrador: `isSuperUser`
// comprueba que el grupo SuperAdmin esté ACTIVO, así que apagarlo convierte al
// SADMIN en un usuario cualquiera. Con una sola petición.

/** RFADMIN43.1 — un rol del sistema no se renombra. */
const vigilarRenombrado = (group, data) => {
  if (!group.isSystem || data.groupName === undefined) return;
  // Reenviar el mismo nombre no es renombrar: el PUT del panel manda el objeto
  // completo, y rechazarlo impediría cambiar cualquier otro campo del rol.
  if (String(data.groupName).trim() === group.groupName) return;
  throw new Error(
    `«${group.groupName}» es un rol del sistema: su nombre no se puede cambiar.`,
  );
};

/**
 * RFADMIN44.1 y 44.2 — un rol del sistema no cambia de estado, y un rol con
 * usuarios activos no se deshabilita.
 */
const vigilarEstado = async (group) => {
  if (group.isSystem) {
    throw new Error(
      `«${group.groupName}» es un rol del sistema: su estado no se puede cambiar.`,
    );
  }
  // Reactivar nunca deja a nadie sin permisos, así que no se vigila.
  if (!group.isActive) return;
  const activos = await groupRepository.countActiveUsers(group.id);
  if (activos > 0) {
    throw new Error(
      `«${group.groupName}» tiene ${activos} usuario(s) activo(s) asignado(s). `
      + 'Deshabilitarlo les quitaría sus permisos de golpe: muévelos a otro rol primero.',
    );
  }
};

/**
 * RFADMIN45.1 — el grupo de superusuario conserva siempre todos los permisos.
 *
 * Aquí sí se compara por nombre, y es lo correcto: SuperAdmin es la identidad
 * declarada del sistema (systemIdentities.js) y la que resuelve `isSuperUser`.
 * No se usa `isSystem` porque los permisos del Administrador SÍ deben poder
 * cambiarse — es justo lo que el RFADMIN45 pide.
 */
const vigilarPermisosDeSuperusuario = (group) => {
  if (group.groupName !== SUPERADMIN_GROUP) return;
  throw new Error(
    'El grupo de superusuario tiene todos los permisos por definición: no se le '
    + 'añaden ni se le quitan.',
  );
};

/**
 * (p51) Los permisos de administración y seguridad, también por rol.
 *
 * La regla vive en access.service.js y se importa en vez de repetirse: por
 * usuario y por rol es la MISMA decisión, y dos copias acabarían divergiendo
 * justo en el sitio donde una divergencia es un agujero.
 *
 * Antes aquí había una regla más estrecha —"nadie concede a un rol un permiso
 * que él mismo no tiene"— que frenaba la escalada pero también lo legítimo:
 * un Administrador no podía darle `create_category` a un rol nuevo.
 *
 * Lo que no cambia: `PUT /api/groups/:id/permissions` reemplaza el conjunto
 * completo, así que solo se revisan los que ENTRAN. Sin esa resta, nadie
 * podría volver a guardar un rol que otra persona configuró antes.
 */

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
    const actual = await groupService.getById(id);
    vigilarRenombrado(actual, data);
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
    await vigilarEstado(record);
    return groupRepository.toggle(id, !record.isActive);
  },

  async assignPermission(groupId, permissionId) {
    const group = await groupService.getById(groupId);
    vigilarPermisosDeSuperusuario(group);
    await vigilarPermisosRestringidos([permissionId]);

    const permission = await permissionRepository.findById(permissionId);
    if (!permission) throw new Error('Permiso no encontrado.');

    const alreadyAssigned = await groupRepository.hasPermission(groupId, permissionId);
    if (alreadyAssigned) throw new Error('El permiso ya está asignado a este grupo.');

    return groupRepository.assignPermission(groupId, permissionId);
  },

  async removePermission(groupId, permissionId) {
    const group = await groupService.getById(groupId);
    vigilarPermisosDeSuperusuario(group);
    await vigilarPermisosRestringidos([permissionId]);

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
    const group = await groupService.getById(groupId);
    vigilarPermisosDeSuperusuario(group);

    // Solo los que entran nuevos. Es un reemplazo completo del conjunto, así
    // que sin esta resta se revisarían también los que el rol ya tenía y
    // nadie podría guardar un rol configurado por otra persona.
    const yaTenia = new Set(
      (await groupRepository.getPermissionsByGroupId(groupId)).map((p) => p.id),
    );
    await vigilarPermisosRestringidos(permissionIds.filter((id) => !yaTenia.has(id)));

    return groupRepository.updatePermissions(groupId, permissionIds);
  },
};
