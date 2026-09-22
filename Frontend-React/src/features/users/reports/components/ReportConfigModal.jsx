// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import { useMemo } from "react";
import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { userReportFields } from "../config/userReportFields";
import { generateUserReport } from "../services/generateUserReport";

export default function UserReportConfigModal({ isOpen, onClose, users = [], statusLabel }) {
    // (p50) El documento se elige de una lista con buscador, no se escribe. El
    // filtro compara el número EXACTO, así que un dígito de más devolvía un
    // reporte vacío sin decir por qué. Y el nombre acompaña al número porque
    // nadie se sabe de memoria la cédula de un compañero.
    //
    // Las opciones salen de los usuarios que la tabla ya tiene cargados: son
    // exactamente los que el reporte puede encontrar, ni uno más.
    const scopeOptions = useMemo(() => [
        { value: "all", label: "Todos los usuarios" },
        {
            value: "document",
            label: "Filtrar por documento",
            search: {
                label: "Número de documento",
                placeholder: "Busque por documento o nombre",
                options: users
                    .filter((u) => u.userDocumentNumber)
                    .map((u) => ({
                        value: String(u.userDocumentNumber),
                        label: `${u.userDocumentNumber} — ${u.userFirstName} ${u.userLastName}`,
                    })),
                vacio: "No hay usuarios en el listado actual.",
            },
        },
    ], [users]);

    const handleGenerate = ({ format, selectedFields, scope, scopeValue }) => {
        generateUserReport({
            users,
            format,
            selectedFields,
            scope,
            documentNumber: scopeValue,
            statusLabel,
        });
    };

    return (
        <ReportConfigModal
            isOpen={isOpen}
            onClose={onClose}
            title="Generar reporte de usuarios"
            fields={userReportFields}
            scopeOptions={scopeOptions}
            onGenerate={handleGenerate}
        />
    );
}
