// Etiquetas de presentación del módulo.

// Criticidad (enum NotificationSeverity del backend)
export const SEVERITY_OPTIONS = ["Critica", "Advertencia", "Informativa"];

const SEVERITY_LABELS = {
  Critica: "Crítica",
  Advertencia: "Advertencia",
  Informativa: "Informativa",
};

export const getSeverityLabel = (s) => SEVERITY_LABELS[s] ?? s ?? "—";

// (p50) `module` solo toma estos tres valores. Antes la columna mostraba el
// valor crudo del backend ("loan-returns"), que no es texto para una pantalla.
const MODULE_LABELS = {
  loans: "Préstamos",
  devolutions: "Devoluciones",
  tasks: "Tareas",
};

export const getModuleLabel = (m) => MODULE_LABELS[m] ?? m ?? "—";

// (p50) Modelos de Prisma tal como los escribe la auditoría → nombre del módulo
// en español, para que el Excel se lea sin conocer el esquema.
const MODEL_LABELS = {
  User: "Usuarios",
  Group: "Grupos",
  GroupPermission: "Permisos de grupo",
  UserPermission: "Permisos de usuario",
  UserGroup: "Usuarios por grupo",
  Permission: "Permisos",
  ContentType: "Módulos del sistema",
  DocumentType: "Tipos de documento",
  Brand: "Marcas",
  Inventory: "Inventarios",
  Category: "Categorías",
  ConsumableMaterial: "Materiales de consumo",
  ReturnableMaterial: "Materiales devolutivos",
  MaterialAccountable: "Cuentadantes del material",
  MaterialImage: "Imágenes del material",
  MaterialTechnicalSheet: "Fichas técnicas",
  Quotation: "Cotizaciones",
  MaterialQuotation: "Cotizaciones por material",
  Loan: "Préstamos",
  LoanMaterial: "Materiales del préstamo",
  LoanSignature: "Firmas del préstamo",
  LoanReturn: "Retornos de préstamo",
  DevolutionRequest: "Devoluciones",
  DevolutionItem: "Materiales de la devolución",
  Task: "Tareas",
  PasswordResetCode: "Recuperación de contraseña",
};

export const getModelLabel = (m) => MODEL_LABELS[m] ?? m ?? "—";

const ACTION_LABELS = { CREATE: "Creación", UPDATE: "Modificación", DELETE: "Eliminación" };

export const getActionLabel = (a) => ACTION_LABELS[a] ?? a ?? "—";
