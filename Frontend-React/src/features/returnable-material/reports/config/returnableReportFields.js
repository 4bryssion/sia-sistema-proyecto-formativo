import { getStatusLabel } from "@/shared/utils/materialStatusLabel";
import { accountableNames } from "@/shared/utils/accountables";
import { money } from "@/shared/utils/formatMoney";
import { formatDateOnly } from "@/shared/utils/formatDate";

// (p48) Campos al día con el módulo. Recordatorio de dónde vive cada dato: todo
// lo COMÚN cuelga de `consumableMaterial` (la tabla padre) y solo categoría,
// modelo, serial y dimensiones son del devolutivo.
export const returnableReportFields = [
  {
    key: "materialName",
    label: "Nombre",
    default: true,
    getter: (m) => m.consumableMaterial?.materialName ?? "",
  },
  {
    key: "inventory",
    label: "Inventario",
    default: true,
    getter: (m) => m.consumableMaterial?.inventory?.inventoryName ?? "",
  },
  {
    key: "brand",
    label: "Marca",
    default: true,
    getter: (m) => m.consumableMaterial?.brand?.brandName ?? "",
  },
  {
    key: "cuentadante",
    label: "Cuentadantes",
    default: true,
    // (p48) Ya no es un usuario suelto sino una lista, y cuelga de la tabla
    // padre. En el reporte caben todos separados por coma.
    getter: (m) => accountableNames(m.consumableMaterial?.accountables).join(", "),
  },
  {
    key: "category",
    label: "Categoría",
    default: true,
    getter: (m) => m.category?.categoryName ?? "",
  },
  {
    key: "senaPlate",
    label: "Placa SENA",
    default: true,
    getter: (m) => m.consumableMaterial?.senaPlate ?? "",
  },
  {
    key: "quantity",
    label: "Cantidad",
    default: true,
    getter: (m) =>
      m.consumableMaterial?.quantity == null
        ? "1 (serializado)"
        : String(m.consumableMaterial.quantity),
  },
  {
    key: "status",
    label: "Estado del material",
    default: true,
    getter: (m) => getStatusLabel(m.consumableMaterial?.status),
  },
  {
    key: "model",
    label: "Modelo",
    default: false,
    getter: (m) => m.model ?? "",
  },
  {
    key: "serial",
    label: "Serial",
    default: false,
    getter: (m) => m.serial ?? "",
  },
  {
    key: "dimensions",
    label: "Dimensiones",
    default: false,
    getter: (m) => m.dimensions ?? "",
  },
  {
    key: "location",
    label: "Ubicación",
    default: false,
    getter: (m) => m.consumableMaterial?.location ?? "",
  },
  {
    key: "unitPrice",
    label: "Valor unitario",
    default: false,
    getter: (m) => money(m.consumableMaterial?.unitPrice),
  },
  {
    key: "totalPrice",
    label: "Valor total",
    default: false,
    getter: (m) => money(m.consumableMaterial?.totalPrice),
  },
  {
    key: "purchaseDate",
    label: "Fecha de compra",
    default: false,
    getter: (m) => formatDateOnly(m.consumableMaterial?.purchaseDate),
  },
  {
    key: "entryDate",
    label: "Fecha de ingreso",
    default: false,
    getter: (m) => formatDateOnly(m.consumableMaterial?.entryDate),
  },
  {
    key: "description",
    label: "Descripción",
    default: false,
    getter: (m) => m.consumableMaterial?.description ?? "",
  },
  {
    key: "isActive",
    label: "Registro",
    default: false,
    getter: (m) => (m.consumableMaterial?.isActive ? "Activo" : "Inactivo"),
  },
];
