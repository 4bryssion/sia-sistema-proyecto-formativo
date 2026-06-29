export const consumableReportFields = [
  {
    key: "materialName",
    label: "Nombre",
    default: true,
    getter: (m) => m.materialName ?? "",
  },
  {
    key: "brand",
    label: "Marca",
    default: true,
    getter: (m) => m.brand?.brandName ?? "",
  },
  {
    key: "userAccount",
    label: "Cuentadante",
    default: true,
    getter: (m) =>
      m.user ? `${m.user.userFirstName} ${m.user.userLastName}` : "",
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
    default: false,
    getter: (m) => m.quantity ?? "",
  },
  {
    key: "location",
    label: "Ubicación",
    default: false,
    getter: (m) => m.location ?? "",
  },
];
