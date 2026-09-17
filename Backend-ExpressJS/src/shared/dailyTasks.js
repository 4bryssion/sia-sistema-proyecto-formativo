// Tareas programadas del servidor.
//
// Hoy solo hay una: desactivar los usuarios cuyo vínculo venció.
//
// Por qué no se usa node-cron:
// - Colombia NO tiene horario de verano (UTC-5 todo el año), que es justo el caso
//   difícil que resuelven las librerías de cron. Sin ese problema, calcular la
//   próxima medianoche es aritmética de fechas y no justifica una dependencia.
// - Una dependencia que falte rompe el arranque del servidor entero; esto no
//   puede fallar de esa forma.
//
// Al arrancar se ejecuta una vez además de programarse: si el servidor estuvo
// apagado durante la hora prevista, la ejecución de esa noche se perdería y los
// usuarios vencidos seguirían activos hasta el día siguiente. El login tiene su
// propia comprobación como segunda red, pero eso solo corrige al usuario que
// intenta entrar, no al listado.

import { userService } from '../features/users/user.service.js';

// Hora local a la que corre. 00:05 y no 00:00 para no competir con cualquier otra
// cosa que ocurra en el cambio de día.
const HORA = 0;
const MINUTO = 5;

const UN_DIA_MS = 24 * 60 * 60 * 1000;

// Milisegundos que faltan para la próxima ocurrencia de HORA:MINUTO en hora local
const msHastaLaProximaEjecucion = () => {
  const ahora = new Date();
  const proxima = new Date(ahora);
  proxima.setHours(HORA, MINUTO, 0, 0);
  if (proxima <= ahora) proxima.setDate(proxima.getDate() + 1);
  return proxima.getTime() - ahora.getTime();
};

const ejecutar = async () => {
  try {
    const { total } = await userService.deactivateExpired();
    if (total > 0) {
      console.log(`[tareas] ${total} usuario(s) desactivado(s) por vínculo vencido.`);
    }
  } catch (err) {
    // Nunca se propaga: un fallo aquí no debe tumbar el servidor ni impedir la
    // ejecución del día siguiente
    console.error('[tareas] Error desactivando usuarios vencidos:', err.message);
  }
};

export const startDailyTasks = () => {
  ejecutar();

  // setTimeout hasta la primera ejecución y desde ahí un intervalo de 24h.
  // No se usa un setInterval directo desde el arranque porque quedaría anclado a
  // la hora en que se levantó el servidor, no a la hora prevista.
  setTimeout(() => {
    ejecutar();
    setInterval(ejecutar, UN_DIA_MS);
  }, msHastaLaProximaEjecucion());

  console.log('[tareas] Desactivación por vínculo vencido programada para las 00:05.');
};
