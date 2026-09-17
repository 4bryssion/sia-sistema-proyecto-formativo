// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { userReportFields } from "../config/userReportFields";
import { generateUserReport } from "../services/generateUserReport";

const SCOPE_OPTIONS = [
    { value: "all", label: "Todos los usuarios" },
    {
        value: "document",
        label: "Filtrar por documento",
        input: { label: "Número de documento", placeholder: "Ingrese el número de documento" },
    },
];

export default function UserReportConfigModal({ isOpen, onClose, users = [], statusLabel }) {
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
            scopeOptions={SCOPE_OPTIONS}
            onGenerate={handleGenerate}
        />
    );
}
