import { PrismaClient } from '@prisma/client';
import { auditoria, contextoTransaccion, vaciarPendientes } from './audit.js';

// (p50) El cliente se exporta YA EXTENDIDO con la auditoría, de modo que todo el
// backend queda auditado sin que ningún service tenga que saberlo.
//
// `base` es el cliente sin extender y existe por una razón concreta: es el que
// escribe en audit_log. Si esa escritura fuera por el cliente extendido, cada
// registro de auditoría generaría otro registro de auditoría, y así sin fin.
const base = new PrismaClient();

const extendido = base.$extends(auditoria(base));

// Envoltorio de `$transaction`.
//
// El problema que resuelve: la auditoría se escribe con `base`, que va por fuera
// de la transacción en curso. Si la transacción revierte —un préstamo sin stock,
// un material con una placa repetida— la operación se deshace, pero su registro
// de auditoría ya estaría escrito. La auditoría diría que ocurrió algo que nunca
// ocurrió, que es peor que no tener auditoría.
//
// Aquí se abre un contexto por transacción: mientras dura, los registros se
// acumulan en memoria (ver `registrar` en audit.js) y solo se escriben si la
// transacción termina bien. Si lanza, el contexto muere con ella y no se escribe
// nada. Se hace con un Proxy y no tocando las 13 llamadas a `$transaction` del
// backend, para que un repositorio nuevo lo herede sin tener que saberlo.
//
// El volcado va después del `await`, no dentro: si fallara, ya no puede arrastrar
// consigo la transacción que acaba de confirmarse.
const prisma = new Proxy(extendido, {
  get(target, prop) {
    if (prop !== '$transaction') return Reflect.get(target, prop);

    return (...args) => {
      // Transacción anidada: se reutiliza el contexto de la externa, para que
      // todo se confirme o se descarte junto y no a medias.
      if (contextoTransaccion.getStore()) return target.$transaction(...args);

      const pendientes = [];
      return contextoTransaccion.run(pendientes, async () => {
        const resultado = await target.$transaction(...args);
        try {
          await vaciarPendientes(base, pendientes);
        } catch (err) {
          console.error('Error registrando auditoría de la transacción:', err.message);
        }
        return resultado;
      });
    };
  },
});

export default prisma;
