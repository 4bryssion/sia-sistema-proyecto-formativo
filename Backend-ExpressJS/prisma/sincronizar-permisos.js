/**
 * (p51) Sincroniza el catálogo de permisos con una base de datos YA EN USO.
 *
 * Se diferencia del seed en una sola cosa, y es la importante: el seed es
 * autoritativo —borra los permisos de los tres roles base y los repone tal como
 * están en la matriz—, así que ejecutarlo sobre una base en uso descarta
 * cualquier ajuste hecho a mano desde el panel de administración. Este script
 * solo AÑADE: crea los permisos nuevos del catálogo, los enlaza a SuperAdmin y
 * a los roles que la matriz indique, y no borra ni un solo enlace existente.
 *
 * Es idempotente: ejecutarlo dos veces seguidas no cambia nada la segunda vez.
 *
 *   npm run sincronizar-permisos
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { contentTypes, initialPermissions, roleMatrix, ROLES_DEL_SISTEMA } from './permissionCatalog.js';

const prisma = new PrismaClient();
const SUPERADMIN = 'SuperAdmin';

async function main() {
  const creados = [];
  const renombrados = [];
  const enlazados = [];

  // 1. Content types. Hacen falta antes que los permisos: cada permiso cuelga de uno.
  for (const ct of contentTypes) {
    await prisma.contentType.upsert({
      where: { appLabel_model: { appLabel: ct.appLabel, model: ct.model } },
      update: { displayName: ct.displayName },
      create: ct,
    });
  }
  const ctMap = Object.fromEntries(
    (await prisma.contentType.findMany()).map((ct) => [ct.appLabel, ct.id]),
  );

  // 2. Permisos del catálogo que no están en la base.
  //
  // El nombre visible SÍ se actualiza si cambió —es una etiqueta— pero el
  // codename nunca: es la clave con la que el código pregunta por el permiso.
  const existentes = new Map(
    (await prisma.permission.findMany()).map((p) => [p.permissionCodename, p]),
  );

  for (const permiso of initialPermissions) {
    const contentTypeId = ctMap[permiso.appLabel];
    if (!contentTypeId) {
      throw new Error(
        `El permiso «${permiso.permissionCodename}» apunta al módulo «${permiso.appLabel}», `
        + 'que no está en la lista de content types del catálogo.',
      );
    }
    const actual = existentes.get(permiso.permissionCodename);
    if (!actual) {
      await prisma.permission.create({
        data: {
          permissionName: permiso.permissionName,
          permissionCodename: permiso.permissionCodename,
          contentTypeId,
          isRestricted: permiso.restricted === true,
        },
      });
      creados.push(permiso.permissionCodename);
    } else {
      // El nombre visible y la marca de restringido sí se corrigen: son
      // propiedades del permiso. El codename nunca, que es su identidad.
      const cambios = {};
      if (actual.permissionName !== permiso.permissionName) cambios.permissionName = permiso.permissionName;
      const restringido = permiso.restricted === true;
      if (actual.isRestricted !== restringido) cambios.isRestricted = restringido;
      if (Object.keys(cambios).length) {
        await prisma.permission.update({ where: { id: actual.id }, data: cambios });
        renombrados.push(`${permiso.permissionCodename}: ${JSON.stringify(cambios)}`);
      }
    }
  }

  const porCodename = new Map(
    (await prisma.permission.findMany()).map((p) => [p.permissionCodename, p]),
  );

  // 3. SuperAdmin tiene TODOS los permisos por definición: cada permiso nuevo
  //    entra ahí sin preguntar, o el superadministrador se quedaría sin acceso
  //    a lo que se acaba de crear.
  const enlazar = async (nombreGrupo, codenames) => {
    const grupo = await prisma.group.findUnique({ where: { groupName: nombreGrupo } });
    if (!grupo) {
      console.log(`· Grupo «${nombreGrupo}» no existe en esta base: se omite.`);
      return;
    }
    const yaTiene = new Set(
      (await prisma.groupPermission.findMany({ where: { groupId: grupo.id } }))
        .map((gp) => gp.permissionId),
    );
    for (const codename of codenames) {
      const permiso = porCodename.get(codename);
      if (!permiso) throw new Error(`La matriz de ${nombreGrupo} pide «${codename}», que no está en el catálogo.`);
      if (yaTiene.has(permiso.id)) continue;
      await prisma.groupPermission.create({
        data: { groupId: grupo.id, permissionId: permiso.id },
      });
      enlazados.push(`${nombreGrupo} ← ${codename}`);
    }
  };

  // (p51) La marca de rol del sistema, por si la base se sembró antes de la
  // migración p51 o alguien creó el rol a mano. Solo la pone; nunca la quita,
  // porque quitarla desprotegería un rol sin que nadie lo pidiera.
  for (const nombre of ROLES_DEL_SISTEMA) {
    const g = await prisma.group.findUnique({ where: { groupName: nombre } });
    if (g && !g.isSystem) {
      await prisma.group.update({ where: { id: g.id }, data: { isSystem: true } });
      console.log(`· «${nombre}» marcado como rol del sistema.`);
    }
  }

  await enlazar(SUPERADMIN, [...porCodename.keys()]);
  for (const [rol, codenames] of Object.entries(roleMatrix)) {
    await enlazar(rol, codenames);
  }

  // 4. Lo que hay en la base y NO en el catálogo. No se borra: pudo crearlo un
  //    superadministrador desde el panel, y borrarlo por iniciativa de un script
  //    sería quitarle acceso a alguien sin avisar. Solo se informa.
  const huerfanos = [...existentes.keys()].filter(
    (c) => !initialPermissions.some((p) => p.permissionCodename === c),
  );

  console.log('');
  console.log(`Permisos del catálogo: ${initialPermissions.length}`);
  console.log(`Creados ahora:         ${creados.length}${creados.length ? ' → ' + creados.join(', ') : ''}`);
  console.log(`Renombrados:           ${renombrados.length}`);
  for (const r of renombrados) console.log(`  · ${r}`);
  console.log(`Enlaces añadidos:      ${enlazados.length}`);
  for (const e of enlazados) console.log(`  · ${e}`);
  if (huerfanos.length) {
    console.log('');
    console.log('En la base pero no en el catálogo (NO se tocaron, revísalos a mano):');
    for (const h of huerfanos) console.log(`  · ${h}`);
  }
  console.log('');
  console.log('Listo. Ningún permiso ni enlace fue eliminado.');
}

main()
  .catch((e) => {
    console.error('Error sincronizando permisos:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
