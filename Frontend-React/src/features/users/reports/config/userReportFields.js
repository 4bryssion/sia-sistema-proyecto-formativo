import { getTopGroupName } from "../../utils/topGroup";

const fmtDateOnly = (d) => (d ? new Date(d).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "");

export const userReportFields = [
  { key: "nombre", label: "Nombre", default: true, accessor: (u) => `${u.userFirstName} ${u.userLastName}` },
  // "Grupo" y no "Rol": mismo criterio que la columna de la tabla — el sistema
  // no razona por nombres de rol y un usuario puede estar en varios grupos
  { key: "grupo", label: "Grupo", default: true, accessor: (u) => getTopGroupName(u) },
  { key: "tipoDocumento", label: "Tipo de documento", default: true, accessor: (u) => u.documentType?.documentName ?? "" },
  { key: "userDocumentNumber", label: "Documento", default: true },
  { key: "userEndDate", label: "Fecha de finalización", default: true, accessor: (u) => fmtDateOnly(u.userEndDate) },
  { key: "userEmail", label: "Correo personal", default: true },
  { key: "userEmailInstitutional", label: "Correo institucional", default: false },
  { key: "userPhone", label: "Teléfono", default: false },
  { key: "userSecondPhone", label: "Segundo teléfono", default: false },
  { key: "userAddress", label: "Dirección", default: false },
  { key: "userAccountType", label: "Tipo de usuario", default: true },
  { key: "estado", label: "Estado", default: true, accessor: (u) => (u.isActive ? "Activo" : "Inactivo") },
];
