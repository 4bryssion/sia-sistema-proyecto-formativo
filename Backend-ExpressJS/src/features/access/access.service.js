import { accessRepository } from './access.repository.js';
import { userRepository } from '../users/user.repository.js';
import { groupRepository } from '../groups/group.repository.js';
import { permissionRepository } from '../permissions/permission.repository.js';
import { SUPERADMIN_GROUP } from '../../config/systemIdentities.js';
import { getActorId } from '../../middleware/requestContext.js';

// (p51) Dos reglas que el permiso de ruta no puede expresar, porque dependen de
// QUÉ se está concediendo y no solo de quién concede.
//
// Sin ellas, tener `assign_group_to_user` —que el rol Administrador tiene— era
// suficiente para dos cosas que nadie pretendió permitir: hacerse SuperAdmin, y
// concederse a sí mismo un permiso reservado, como `download_audit`.

/** Solo un SuperAdmin reparte o quita la pertenencia al grupo SuperAdmin. */
const vigilarGrupoDeSuperusuario = async (group) => {
  if (group.groupName !== SUPERADMIN_GROUP) return;
  if (await accessRepository.isSuperUser(getActorId())) return;
  throw new Error('Solo un superadministrador puede gestionar la pertenencia a ese grupo.');
};

/**
 * Los permisos de administración y seguridad solo los reparte un superusuario.
 *
 * Sustituye a la regla anterior, que era "nadie concede un permiso que no
 * tiene". Aquella frenaba la escalada, pero frenaba también lo legítimo: un
 * Administrador no podía darle `create_category` a un rol nuevo, y eso es
 * inventario puro, justo lo que un Administrador debe repartir.
 *
 * La línea no está en "¿lo tengo yo?" sino en "¿de qué es este permiso?". Hay
 * un conjunto pequeño —la auditoría, el catálogo de permisos, la administración
 * de roles y el reparto de permisos y grupos— que decide quién puede qué; ese
 * se queda en el superadministrador. El resto es sobre lo que el sistema HACE,
 * y quien administra lo reparte entero, lo tenga él o no.
 *
 * La marca vive en la columna `is_restricted`, no en una lista aquí dentro: así
 * el panel puede mostrarla y cambiarla no obliga a tocar código.
 *
 * Vigila las dos direcciones. Quitar `edit_group` al rol Administrador no es
 * una escalada, pero sí es desarmar la administración de roles, y eso tampoco
 * es decisión de quien administra el día a día.
 */
export const vigilarPermisosRestringidos = async (permissionIds) => {
  const ids = (Array.isArray(permissionIds) ? permissionIds : [permissionIds])
    .map(Number).filter(Number.isInteger);
  if (!ids.length) return;
  if (await accessRepository.isSuperUser(getActorId())) return;

  const restringidos = await permissionRepository.findRestricted(ids);
  if (!restringidos.length) return;

  const nombres = restringidos.map((x) => `«${x.permissionName}»`).join(', ');
  throw new Error(
    'Solo un superadministrador puede repartir permisos de administración y '
    + `seguridad del sistema: ${nombres}.`,
  );
};

/**
 * (p51) A quien administra el sistema solo le asigna tareas un superadministrador
 * o alguien de su mismo grupo.
 *
 * Decisión de Santiago: «solo SADMIN pueda otorgar tareas a Admin y entre admin,
 * nadie más puede darle tareas al grupo admin». Está escrita como una sola regla
 * simétrica porque su enunciado dejaba un hueco: no decía quién puede asignarle
 * tareas al SADMIN, y si un Instructor no puede dársela a un Administrador,
 * menos al superadministrador.
 *
 * Qué queda, con los grupos marcados hoy (`is_system`: SuperAdmin y Administrador):
 *   - SADMIN   → a cualquiera.
 *   - Admin    → a Admin (el «entre admin») y a todos los demás; al SADMIN no.
 *   - Los demás→ ni a Admin ni al SADMIN.
 *
 * La marca vive en la columna `is_system`, no en una lista de nombres aquí: es
 * la misma columna que ya impide renombrar o deshabilitar esos grupos.
 *
 * No es una regla de permisos, y por eso no la puede expresar `requirePermission`:
 * `create_task` dice que puedes crear tareas, no A QUIÉN se le pueden poner.
 *
 * @param {number[]} userIds  los encargados que ENTRAN o SALEN de una tarea.
 *   A quien ya estaba y se queda no se le mira: si no, alguien sin este alcance
 *   no podría ni corregirle el título a una tarea que no armó él.
 */
export const vigilarEncargadosProtegidos = async (userIds) => {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).map(Number))]
    .filter(Number.isInteger);
  if (!ids.length) return;

  const actorId = getActorId();
  if (await accessRepository.isSuperUser(actorId)) return;

  const membresias = await accessRepository.findSystemGroupMembership([...ids, Number(actorId)]);
  if (!membresias.length) return;

  // Los grupos del sistema (activos) a los que pertenece quien está asignando.
  const mios = new Set(
    membresias
      .filter((m) => m.userId === Number(actorId) && m.groupIsActive)
      .map((m) => m.groupName),
  );

  // Un encargado protegido es asignable si comparte conmigo alguno de sus
  // grupos del sistema. Con varios grupos basta uno: ya estamos en el mismo
  // nivel de administración.
  const porUsuario = new Map();
  for (const m of membresias.filter((x) => ids.includes(x.userId))) {
    const previo = porUsuario.get(m.userId);
    porUsuario.set(m.userId, {
      nombre: m.userName,
      grupos: [...(previo?.grupos ?? []), m.groupName],
      // Basta UN grupo compartido, y da igual en qué orden lleguen las filas.
      compartido: (previo?.compartido ?? false) || mios.has(m.groupName),
    });
  }
  const bloqueados = [...porUsuario.values()].filter((u) => !u.compartido);
  if (!bloqueados.length) return;

  const detalle = bloqueados
    .map((u) => `${u.nombre} (${u.grupos.join(', ')})`)
    .join('; ');
  throw new Error(
    'Solo un superadministrador, o alguien del mismo grupo, puede asignarle tareas a '
    + `quien administra el sistema: ${detalle}.`,
  );
};

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
    await vigilarGrupoDeSuperusuario(group);

    const alreadyAssigned = await accessRepository.hasGroup(userId, groupId);
    if (alreadyAssigned) throw new Error('El usuario ya pertenece a este grupo.');

    return accessRepository.assignGroup(userId, groupId);
  },

  async removeGroup(userId, groupId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado.');

    // Quitar el grupo SuperAdmin es tan delicado como darlo: dejaría el sistema
    // sin quien administre.
    const group = await groupRepository.findById(groupId);
    if (group) await vigilarGrupoDeSuperusuario(group);

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
    await vigilarPermisosRestringidos([permission.id]);

    const alreadyAssigned = await accessRepository.hasPermission(userId, permissionId);
    if (alreadyAssigned) throw new Error('El usuario ya tiene este permiso directo.');

    return accessRepository.assignPermission(userId, permissionId);
  },

  async removePermission(userId, permissionId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado.');

    // (p51) También al quitar: desarmar la administración del sistema tampoco
    // es decisión de quien administra el día a día.
    await vigilarPermisosRestringidos([permissionId]);

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

  /**
   * (p51) Lo que el frontend necesita saber de SI MISMO, en una sola consulta.
   *
   * Hasta ahora era solo la lista de permisos. Hace falta algo mas: si pertenezco
   * a un grupo del sistema y si soy superusuario. Sin eso, el select de
   * encargados no puede saber a quien si y a quien no puede asignarle una tarea,
   * y la unica forma de enterarse seria intentarlo y recibir el error.
   *
   * Va aqui y no en una ruta nueva porque es la ruta de "quien soy", la unica de
   * accesos que cualquier usuario autenticado puede llamar sin permisos: pedirle
   * a un aprendiz que consulte sus grupos por `GET /access/users/:id/groups`
   * exigiria darle un permiso restringido.
   */
  async getMyContext(userId) {
    const [permissions, isSuperUser, membresias] = await Promise.all([
      accessService.getEffectivePermissions(userId),
      accessRepository.isSuperUser(userId),
      accessRepository.findSystemGroupMembership([userId]),
    ]);
    return {
      permissions,
      isSuperUser,
      // Solo los activos: un grupo deshabilitado no habilita a nadie, igual que
      // en `isSuperUser`.
      systemGroups: membresias.filter((m) => m.groupIsActive).map((m) => m.groupName),
    };
  },

  // Estilo edward: SuperAdmin tiene todos los permisos; el resto por UNION directos+grupos
  async hasPermission(userId, permissionCode) {
    if (await accessRepository.isSuperUser(userId)) return true;
    const permissions = await accessRepository.getUserPermissionCodenames(userId);
    return permissions.includes(permissionCode);
  },
};
