// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { loanReportFields } from "../config/loanReportField";
import { generateLoanReport } from "../services/generateLoanReport";

const SCOPE_OPTIONS = [
    { value: "all", label: "Todos los préstamos" },
    {
        value: "usuario",
        label: "Filtrar por usuario solicitante",
        // (p48) El solicitante puede ser externo, y entonces se le identifica por
        // su correo: el filtro acepta las dos formas
        input: {
            label: "Usuario solicitante",
            placeholder: "Nombre completo o correo del receptor",
        },
    },
];

export default function LoanReportConfigModal({ isOpen, onClose, loans = [], statusLabel }) {
    const handleGenerate = ({ format, selectedFields, scope, scopeValue }) => {
        generateLoanReport({
            loans,
            format,
            selectedFields,
            scope,
            usuario: scopeValue,
            statusLabel,
        });
    };

    return (
        <ReportConfigModal
            isOpen={isOpen}
            onClose={onClose}
            title="Generar reporte de préstamos"
            fields={loanReportFields}
            scopeOptions={SCOPE_OPTIONS}
            onGenerate={handleGenerate}
        />
    );
}
