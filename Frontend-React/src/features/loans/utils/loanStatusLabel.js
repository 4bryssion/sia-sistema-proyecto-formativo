const LOAN_STATUS_LABELS = {
  Pendiente_confirmacion: "Pendiente de confirmación",
  Activo: "Activo",
  Finalizado: "Finalizado",
};

export const getLoanStatusLabel = (status) => LOAN_STATUS_LABELS[status] ?? status ?? "—";
