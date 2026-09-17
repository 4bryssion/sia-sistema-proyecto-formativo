import { accountableNames } from "@/shared/utils/accountables";
import { getStatusLabel } from "@/shared/utils/materialStatusLabel";
import { money } from "@/shared/utils/formatMoney";
import { formatDateOnly } from "@/shared/utils/formatDate";

// (p48) Los campos del reporte se pusieron al día con los del módulo: el
// material de consumo ganó inventario, varios cuentadantes y fecha de ingreso, y
// la marca pasó a opcional.
export const consumableReportFields = [
  {
    key: "materialName",
    label: "Nombre",
    default: true,
    getter: (m) => m.materialName ?? "",
  },
  {
    key: "inventory",
    label: "Inventario",
    default: true,
    getter: (m) => m.inventory?.inventoryName ?? "",
  },
  {
    key: "brand",
    label: "Marca",
    default: true,
    getter: (m) => m.brand?.brandName ?? "",
  },
  {
    key: "userAccount",
    label: "Cuentadantes",
    default: true,
    // (p48) Ya no es un usuario suelto sino una lista. En el reporte caben
    // todos separados por coma: es una celda de texto, no una columna de tabla.
    getter: (m) => accountableNames(m.accountables).join(", "),
  },
  {
    key: "senaPlate",
    label: "Placa SENA",
    default: true,
    getter: (m) => m.senaPlate ?? "",
  },
  {
    key: "quantity",
    label: "Cantidad",
    default: true,
    // quantity null ⇒ serializado (tiene placa): su cantidad efectiva es 1
    getter: (m) => (m.quantity == null ? "1 (serializado)" : String(m.quantity)),
  },
  {
    key: "status",
    label: "Estado del material",
    default: true,
    getter: (m) => getStatusLabel(m.status),
  },
  {
    key: "location",
    label: "Ubicación",
    default: false,
    getter: (m) => m.location ?? "",
  },
  {
    key: "unitPrice",
    label: "Valor unitario",
    default: false,
    getter: (m) => money(m.unitPrice),
  },
  {
    key: "totalPrice",
    label: "Valor total",
    default: false,
    getter: (m) => money(m.totalPrice),
  },
  {
    key: "purchaseDate",
    label: "Fecha de compra",
    default: false,
    getter: (m) => formatDateOnly(m.purchaseDate),
  },
  {
    key: "entryDate",
    label: "Fecha de ingreso",
    default: false,
    getter: (m) => formatDateOnly(m.entryDate),
  },
  {
    key: "description",
    label: "Descripción",
    default: false,
    getter: (m) => m.description ?? "",
  },
  {
    key: "isActive",
    label: "Registro",
    default: false,
    getter: (m) => (m.isActive ? "Activo" : "Inactivo"),
  },
];
