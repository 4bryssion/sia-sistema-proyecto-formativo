const STATUS_LABELS = {
  Disponible:    "Disponible",
  No_disponible: "No disponible",
  Mantenimiento: "Mantenimiento",
  En_prestamo:   "En préstamo",
  Traslado:      "Traslado",
  Baja:          "Baja",
};

export const getStatusLabel = (status) =>
  STATUS_LABELS[status] ?? status ?? "—";

// Opciones para el FilterMenu de la tabla. Se derivan del mismo mapa de
// etiquetas para que agregar un estado al enum no obligue a tocar dos listas.
export const STATUS_FILTER_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);
