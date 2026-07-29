// Etiqueta legible del filtro de estado de los listados (active/inactive/all).
//
// El valor viaja como código en la URL y en el hook de datos, pero en el
// encabezado de un reporte tiene que leerse en español. Se centraliza aquí
// porque los cuatro listados usan exactamente el mismo trío de valores.

const LABELS = {
  active: "Solo registros activos",
  inactive: "Solo registros inactivos",
  all: "Activos e inactivos",
};

export const getStatusFilterLabel = (status) => LABELS[status] ?? LABELS.active;
