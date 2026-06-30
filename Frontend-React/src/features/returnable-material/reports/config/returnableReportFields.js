import { getStatusLabel } from "../../utils/statusLabel";

export const returnableReportFields = [
  {
    key: "materialName",
    label: "Nombre",
    default: true,
    getter: (m) => m.consumableMaterial?.materialName ?? "",
  },
  {
    key: "brand",
    label: "Marca",
    default: true,
    getter: (m) => m.consumableMaterial?.brand?.brandName ?? "",
  },
  {
    key: "cuentadante",
    label: "Cuentadante",
    default: true,
    getter: (m) =>
      m.consumableMaterial?.user
        ? `${m.consumableMaterial.user.userFirstName} ${m.consumableMaterial.user.userLastName}`
        : "",
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
    default: false,
    getter: (m) => m.consumableMaterial?.quantity?.toString() ?? "",
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
    key: "location",
    label: "Ubicación",
    default: false,
    getter: (m) => m.consumableMaterial?.location ?? "",
  },
  {
    key: "status",
    label: "Estado",
    default: false,
    getter: (m) => getStatusLabel(m.consumableMaterial?.status),
  },
];
