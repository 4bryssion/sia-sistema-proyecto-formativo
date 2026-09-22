export const TASK_STATUS_LABELS = {
  en_progreso: "En progreso",
  completada: "Completada",
  no_completada: "No completada",
};

// (p50) Para el filtro de la barra de la tabla y para el select del modal de
// editar. Se derivan de las etiquetas para que no haya dos listas que mantener.
export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS)
  .map(([value, label]) => ({ value, label }));

// Las que una persona puede poner a mano. `no_completada` no está: lo pone el
// vencimiento automático, y una vez puesto ya no se cambia.
export const TASK_STATUS_EDITABLES = ["en_progreso", "completada"];

export const getTaskStatusLabel = (s) => TASK_STATUS_LABELS[s] ?? s ?? "—";
