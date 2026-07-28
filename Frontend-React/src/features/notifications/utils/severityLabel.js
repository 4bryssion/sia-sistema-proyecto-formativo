// Catálogo de criticidad (enum NotificationSeverity del backend)
export const SEVERITY_OPTIONS = ["Critica", "Advertencia", "Informativa"];

const SEVERITY_LABELS = {
  Critica:     "Crítica",
  Advertencia: "Advertencia",
  Informativa: "Informativa",
};

export const getSeverityLabel = (s) => SEVERITY_LABELS[s] ?? s ?? "—";

// Formato de auditoría del proyecto: HH:MM, DD/MM/AAAA
export const formatAuditDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  const hhmm = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${hhmm}, ${date.toLocaleDateString("es-CO")}`;
};
