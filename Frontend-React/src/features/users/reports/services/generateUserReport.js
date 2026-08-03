// Orquesta el reporte de usuarios: arma el dataset y delega la generación del
// archivo en el generador compartido (shared/reports/generateReport), que es el
// que pone el encabezado con sistema, fecha/hora, usuario generador y totales.

import { buildReportDataset } from "../utils/buildReportDataset";
import { generateReport } from "@/shared/reports/generateReport";

export function generateUserReport({
    users = [],
    format,
    selectedFields,
    scope,
    documentNumber,
    // Estado con el que está filtrada la tabla (activos/inactivos/todos): se
    // refleja en el encabezado para que el reporte diga a qué corresponde
    statusLabel,
}) {

    const { headers, rows } = buildReportDataset({
        users,
        selectedFields,
        scope,
        documentNumber
    });

    return generateReport({
        format,
        title: "Reporte de usuarios",
        fileBase: "usuarios",
        sheetName: "Usuarios",
        headers,
        rows,
        filters: [
            { label: "Estado", value: statusLabel },
            {
                label: "Alcance",
                value: scope === "document" && documentNumber
                    ? `Usuario con documento ${documentNumber}`
                    : "Todos los usuarios listados",
            },
        ],
    });
}
