import { getTopGroupName } from "@/shared/utils/topGroup";
import { formatDateOnly } from "@/shared/utils/formatDate";

// (p48) Campos al día con el módulo: apareció la fecha de INICIO, que junto con
// la de finalización define la vigencia del vínculo y decide si el usuario puede
// entrar al sistema.
export const userReportFields = [
  { key: "nombre", label: "Nombre", default: true, accessor: (u) => `${u.userFirstName} ${u.userLastName}` },
  // "Grupo" y no "Rol": mismo criterio que la columna de la tabla — el sistema
  // no razona por nombres de rol y un usuario puede estar en varios grupos
  { key: "grupo", label: "Grupo", default: true, accessor: (u) => getTopGroupName(u) },
  { key: "tipoDocumento", label: "Tipo de documento", default: true, accessor: (u) => u.documentType?.documentName ?? "" },
  { key: "userDocumentNumber", label: "Documento", default: true },
  { key: "userStartDate", label: "Fecha de inicio", default: true, accessor: (u) => formatDateOnly(u.userStartDate) },
  { key: "userEndDate", label: "Fecha de finalización", default: true, accessor: (u) => formatDateOnly(u.userEndDate) },
  { key: "userEmail", label: "Correo personal", default: true },
  { key: "userEmailInstitutional", label: "Correo institucional", default: false },
  { key: "userPhone", label: "Teléfono", default: false },
  { key: "userSecondPhone", label: "Segundo teléfono", default: false },
  { key: "userAddress", label: "Dirección", default: false },
  { key: "userAccountType", label: "Tipo de usuario", default: true },
  { key: "estado", label: "Estado", default: true, accessor: (u) => (u.isActive ? "Activo" : "Inactivo") },
];
