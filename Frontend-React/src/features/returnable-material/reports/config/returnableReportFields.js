// Definición de campos disponibles para el reporte de materiales retornables
// Patrón: configuración estática (source of truth para campos del reporte)
export const returnableReportFields = [
    { key: "cuentadante", label: "Cuentadante", default: true },
    { key: "marca", label: "Marca", default: true },
    { key: "placa_sena", label: "Placa SENA", default: true },
    { key: "nombre_material", label: "Nombre", default: true },
    { key: "modelo", label: "Modelo", default: false },
    { key: "serial", label: "Serial", default: false },
    { key: "ubicacion", label: "Ubicación", default: false },
    { key: "estado", label: "Estado", default: false },
];