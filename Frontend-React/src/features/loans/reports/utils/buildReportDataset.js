import { receiverName } from "../config/loanReportField";

export function buildReportDataset({
  loans = [],
  selectedFields,
  scope,
  usuario,
}) {
  let filtered = [...loans];

  // El valor del alcance es "usuario", no "user". Estaban descuadrados: el
  // modal y este filtro decían "user" y el generador comparaba "usuario", así
  // que el encabezado del reporte SIEMPRE decía "Todos los préstamos listados"
  // aunque estuviera filtrado por una persona. Ahora los tres usan el mismo.
  if (scope === "usuario" && usuario) {
    const needle = usuario.trim().toLowerCase();
    // (p48) receiverName devuelve el nombre o, si el receptor es externo, su
    // correo: así el filtro sirve para las dos clases de receptor
    filtered = filtered.filter((loan) => receiverName(loan).toLowerCase().includes(needle));
  }

  const headers = selectedFields.map((f) => f.label);

  const rows = filtered.map((loan) =>
    selectedFields.map((field) => {
      const value = field.getter ? field.getter(loan) : (loan[field.key] ?? "");
      return value ?? "";
    })
  );

  return { headers, rows };
}
