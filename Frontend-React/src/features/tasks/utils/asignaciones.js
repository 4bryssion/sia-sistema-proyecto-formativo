// (p51) Cómo se leen las asignaciones de una tarea en pantalla.
//
// Desde que una tarea puede ir a varias personas, cada una con su propio estado,
// hay cuatro sitios que necesitan responder a lo mismo —la tabla, el modal de
// consulta, el de edición y el reporte—. Estaba a punto de escribirlo cuatro
// veces; vive aquí una sola vez.
//
// Es `utils` de la feature y no de `shared/` porque solo lo usan pantallas de
// tareas: nada fuera del módulo sabe qué es una asignación.

// La extensión va explícita (y no como en el resto del proyecto, que la omite
// porque Vite la resuelve) para que este módulo se pueda importar tal cual
// desde las pruebas, que corren en Node y ahí la extensión es obligatoria.
// Es lógica con reglas —cuándo una tarea está "mixta", qué se busca y qué se
// lee— y probarla de verdad vale más que la uniformidad del import.
import { TASK_STATUS_LABELS, getTaskStatusLabel } from "../constants/taskStatus.js";

const nombreDe = (usuario) =>
  usuario ? `${usuario.userFirstName} ${usuario.userLastName}`.trim() : null;

/** Los nombres de los encargados, ordenados como vienen del backend. */
export const nombresDeEncargados = (task) =>
  (task?.assignments ?? []).map((a) => nombreDe(a.user)).filter(Boolean);

/**
 * Lo que se LEE en la celda: un nombre si hay uno, el recuento si hay varios.
 *
 * Con cinco encargados no caben cinco nombres en una celda, y recortarlos con
 * puntos suspensivos deja a la vista uno arbitrario, que es peor que no mostrar
 * ninguno: parece que la tarea es de esa persona. La lista completa está en el
 * modal de consulta, que es donde hay sitio.
 */
export const etiquetaEncargados = (task) => {
  const nombres = nombresDeEncargados(task);
  if (nombres.length === 0) return "—";
  if (nombres.length === 1) return nombres[0];
  return `${nombres.length} personas`;
};

/**
 * Lo que se BUSCA en la celda. Son dos funciones distintas a propósito: si el
 * buscador de la tabla recibiera "5 personas", buscar a alguien por su nombre no
 * encontraría su tarea — y justo en el caso nuevo, que es el que hay que probar.
 */
export const textoBusquedaEncargados = (task) => {
  const nombres = nombresDeEncargados(task);
  return nombres.length ? nombres.join(" · ") : "—";
};

/** El estado de la tarea entera. Lo calcula el backend; aquí solo se traduce. */
export const estadoDeTarea = (task) =>
  task?.resumen?.estado ?? task?.miAsignacion?.status ?? "en_progreso";

export const etiquetaEstado = (task) => getTaskStatusLabel(estadoDeTarea(task));

/**
 * El avance, para ponerlo junto al estado cuando hay más de un encargado. Con
 * uno solo no se escribe nada: "1 de 1 completadas" no informa de nada.
 */
export const etiquetaAvance = (task) => {
  const r = task?.resumen;
  if (!r || r.total <= 1) return null;
  return `${r.completadas} de ${r.total} completadas`;
};

export { TASK_STATUS_LABELS };
