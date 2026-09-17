const LOAN_STATUS_LABELS = {
  Pendiente_confirmacion: "Pendiente de confirmación",
  Activo: "Activo",
  Finalizado: "Finalizado",
};

export const getLoanStatusLabel = (status) => LOAN_STATUS_LABELS[status] ?? status ?? "—";

// (p48) Naturaleza del préstamo. Los valores del enum ya se leen bien en
// español, así que el mapa existe para tener un único sitio donde cambiarlos y
// para resolver el caso "sin dato" igual que el resto del proyecto.
const LOAN_TYPE_LABELS = {
  Interno: "Interno",
  Externo: "Externo",
};

export const getLoanTypeLabel = (loanType) => LOAN_TYPE_LABELS[loanType] ?? loanType ?? "—";

// Opciones del FilterMenu de la barra de la tabla. Se derivan del mismo mapa de
// etiquetas para que agregar un estado al enum no obligue a tocar dos listas.
export const LOAN_STATUS_FILTER_OPTIONS = [
  ...Object.entries(LOAN_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  // La tabla también lista las solicitudes de devolución en espera. Sus dos
  // estados no son del préstamo, así que se filtran por la clave sintética que
  // arma ListLoanPage (`Devolucion_<tipo>`).
  { value: "Devolucion_Total",   label: "En espera de autorizar devolución total" },
  { value: "Devolucion_Parcial", label: "En espera de autorizar devolución parcial" },
];
