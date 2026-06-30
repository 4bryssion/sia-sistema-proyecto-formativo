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
