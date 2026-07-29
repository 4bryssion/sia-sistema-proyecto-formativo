// Identidades especiales del sistema.
//
// El grupo de superusuario es el ÚNICO nombre acoplado que queda en el proyecto
// (patrón estándar de superusuario). Vivía repetido como literal 'SuperAdmin' en
// el repositorio de accesos y, sobre todo, como filtro en media docena de
// pantallas del frontend. Centralizarlo aquí permite:
//
//   1. Que el nombre exista una sola vez en el código.
//   2. Excluir al SADMIN y a su grupo EN EL ORIGEN (los repositorios), en vez de
//      confiar en que cada select, tabla o reporte del frontend se acuerde de
//      filtrarlo. Si un listado nuevo olvida el filtro, el dato se filtra; si la
//      exclusión está en la consulta, no hay forma de que se escape.

export const SUPERADMIN_GROUP = 'SuperAdmin';

// Cláusulas `where` de Prisma reutilizables.

/** Excluye el grupo de superusuario de un findMany sobre `group` */
export const withoutSuperAdminGroup = {
  groupName: { not: SUPERADMIN_GROUP },
};

/** Excluye a los usuarios que pertenecen al grupo de superusuario */
export const withoutSuperAdminUsers = {
  groups: { none: { group: { groupName: SUPERADMIN_GROUP } } },
};
