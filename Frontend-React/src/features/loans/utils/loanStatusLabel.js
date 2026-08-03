const LOAN_STATUS_LABELS = {
  Pendiente_confirmacion: "Pendiente de confirmación",
  Activo: "Activo",
  Finalizado: "Finalizado",
};

export const getLoanStatusLabel = (status) => LOAN_STATUS_LABELS[status] ?? status ?? "—";

// Opciones del FilterMenu de la barra de la tabla. Se derivan del mismo mapa de
// etiquetas para que agregar un estado al enum no obligue a tocar dos listas.
export const LOAN_STATUS_FILTER_OPTIONS = Object.entries(LOAN_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);
