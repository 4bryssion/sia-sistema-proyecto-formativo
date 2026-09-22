import { AsyncLocalStorage } from 'node:async_hooks';
import { getActorId } from '../middleware/requestContext.js';

// (p50) Auditoría automática.
//
// Una sola pieza registra toda escritura de todos los modelos, en lugar de las
// 30 llamadas a notify() repartidas por 9 services que había antes. Es el
// equivalente de las señales post_save/post_delete de Django: el framework no
// audita solo, pero sí ofrece dónde engancharse una vez.
//
// Lo que esto cierra, y que auditar a mano había dejado abierto:
//   - cambios de contraseña (auth): sin registrar,
//   - categorías y tipos de documento: sin registrar,
//   - permisos de un grupo: cambiar QUÉ PUEDE HACER cada grupo no dejaba huella.
//
// LÍMITE HONESTO: una extensión de Prisma ve las operaciones de MODELO. No ve
// `$executeRaw` ni `$queryRaw`. Por eso group.repository.js pasó de SQL crudo a
// llamadas de Prisma en esta misma fase: si no, el hueco más grave seguiría ahí.
// Cualquier SQL crudo que se agregue en el futuro queda fuera de esta red.

// Modelos que NO se auditan, y por qué cada uno:
const SIN_AUDITORIA = new Set([
  // Se auditaría a sí misma en bucle infinito.
  'AuditLog',
  // Una notificación es la CONSECUENCIA de una acción que ya quedó auditada por
  // su cuenta. Registrarla otra vez duplicaría cada evento del sistema.
  'Notification',
]);

// Campos que NUNCA se guardan en la auditoría, ni en `before` ni en `after`.
//
// Es la regla más importante de este archivo: la auditoría se descarga a un
// Excel, y un Excel con hashes de contraseña o con identificadores de sesión
// activos circulando por correo sería peor que no tener auditoría.
const CAMPOS_SENSIBLES = new Set([
  'userPassword',
  'activeSessionJti',
  'codeHash',
  'resetTicket',
]);

// Una actualización que SOLO toca estos campos es mantenimiento de sesión
// —latido, renovación de ventana— y no una acción de nadie: no se audita.
// Entrar y salir sí quedan registrados, porque esas escrituras tocan el jti.
const CAMPOS_DE_LATIDO = new Set(['activeSessionExpiresAt']);

const limpiar = (valor) => {
  if (!valor || typeof valor !== 'object') return valor;
  const salida = {};
  for (const [clave, v] of Object.entries(valor)) {
    if (CAMPOS_SENSIBLES.has(clave)) continue;
    // Las fechas no sobreviven a JSONB como objeto Date
    salida[clave] = v instanceof Date ? v.toISOString() : v;
  }
  return salida;
};

const esSoloLatido = (data) => {
  if (!data || typeof data !== 'object') return false;
  const claves = Object.keys(data);
  return claves.length > 0 && claves.every((c) => CAMPOS_DE_LATIDO.has(c));
};

// Identificador de la fila, como texto. Las claves compuestas se serializan
// enteras porque ninguna de sus partes identifica por sí sola.
const idDe = (registro, where) => {
  const fuente = registro ?? where;
  if (fuente == null) return null;
  if (typeof fuente !== 'object') return String(fuente);
  if (fuente.id != null) return String(fuente.id);
  return JSON.stringify(fuente).slice(0, 120);
};

const ACCION = {
  create: 'CREATE', createMany: 'CREATE', createManyAndReturn: 'CREATE',
  update: 'UPDATE', updateMany: 'UPDATE', upsert: 'UPDATE',
  delete: 'DELETE', deleteMany: 'DELETE',
};

// Operaciones de UNA fila: se puede leer el estado anterior sin riesgo de traer
// media tabla a memoria. En las *Many solo se registra el criterio.
const DE_UNA_FILA = new Set(['update', 'delete', 'upsert']);

// ---------------------------------------------------------------------------
// Auditoría dentro de transacciones.
//
// El registro se escribe con el cliente SIN extender, que va por fuera de la
// transacción en curso. Sin más cuidado, una transacción revertida dejaría en
// la auditoría la huella de algo que nunca ocurrió: exactamente la mentira que
// una auditoría no se puede permitir.
//
// Por eso, mientras se está dentro de una transacción los registros se acumulan
// en memoria y solo se escriben cuando la transacción termina bien. Si revierte,
// se descartan con ella. Ver el envoltorio de `$transaction` en prisma.js.
// ---------------------------------------------------------------------------
export const contextoTransaccion = new AsyncLocalStorage();

/** Escribe ya, o encola si hay una transacción abierta. */
export const registrar = async (base, data) => {
  const pendientes = contextoTransaccion.getStore();
  if (pendientes) {
    pendientes.push(data);
    return;
  }
  await base.auditLog.create({ data });
};

/** Vuelca lo acumulado por una transacción que terminó bien. */
export const vaciarPendientes = async (base, pendientes) => {
  if (!pendientes?.length) return;
  await base.auditLog.createMany({ data: pendientes });
};

/**
 * Extensión que audita toda escritura.
 *
 * @param {import('@prisma/client').PrismaClient} base cliente sin extender, que
 *   es el que escribe en audit_log. Usar el extendido se auditaría a sí mismo.
 */
export const auditoria = (base) => ({
  name: 'auditoria',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const accion = ACCION[operation];

        // Lecturas y modelos excluidos pasan de largo sin coste alguno.
        if (!accion || SIN_AUDITORIA.has(model)) return query(args);
        if (operation === 'update' && esSoloLatido(args?.data)) return query(args);

        // Estado anterior, solo cuando se trata de una fila concreta.
        let antes = null;
        if (DE_UNA_FILA.has(operation) && args?.where) {
          try {
            antes = await base[model[0].toLowerCase() + model.slice(1)]
              .findUnique({ where: args.where });
          } catch {
            // Un `where` que no es único (update con filtro compuesto) no se
            // puede leer así. Se sigue sin el estado anterior: es mejor una
            // auditoría con un dato menos que una operación que falla.
            antes = null;
          }
        }

        const resultado = await query(args);

        // Una operación masiva que no alcanzó ninguna fila no es un cambio: no
        // hay nada que auditar. Importa más de lo que parece — `markOverdue` de
        // tareas es un updateMany que se ejecuta antes de cada listado y que
        // casi nunca toca nada; sin esto, abrir la pantalla de tareas ensuciaría
        // la auditoría con una fila vacía cada vez.
        if (!DE_UNA_FILA.has(operation) && operation !== 'create' && resultado?.count === 0) {
          return resultado;
        }

        // El registro de auditoría NUNCA puede romper la operación que audita.
        // Se espera a que termine —para no perderlo si el proceso se cierra— pero
        // cualquier fallo suyo se traga y se reporta por consola.
        try {
          await registrar(base, {
            actorId: getActorId(),
            action: accion,
            model,
            recordId: idDe(resultado, args?.where),
            before: antes ? limpiar(antes) : undefined,
            // En las *Many el resultado es un contador, no la fila: se guarda
            // lo que se pidió hacer y a cuántas filas alcanzó.
            after: DE_UNA_FILA.has(operation) || operation === 'create'
              ? limpiar(resultado)
              : limpiar({ criterio: args?.where ?? null, datos: args?.data ?? null, alcance: resultado?.count }),
          });
        } catch (err) {
          console.error('Error registrando auditoría:', err.message);
        }

        return resultado;
      },
    },
  },
});
