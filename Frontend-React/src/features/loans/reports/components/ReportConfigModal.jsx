// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import { useMemo } from "react";
import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { loanReportFields, receiverName } from "../config/loanReportField";
import { generateLoanReport } from "../services/generateLoanReport";

export default function LoanReportConfigModal({ isOpen, onClose, loans = [], statusLabel }) {
    // (p50) El solicitante se elige de una lista con buscador. Las opciones son
    // los receptores que aparecen en los préstamos listados, sin repetir: una
    // persona con ocho préstamos sale una sola vez.
    //
    // (p48) El receptor puede ser externo, y entonces `receiverName` devuelve su
    // correo en vez del nombre. Se usa la misma función que el filtro, así que
    // lo que se elige y lo que se compara son siempre el mismo texto.
    const scopeOptions = useMemo(() => {
        const nombres = [...new Set(loans.map(receiverName).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "es"));
        return [
            { value: "all", label: "Todos los préstamos" },
            {
                value: "usuario",
                label: "Filtrar por usuario solicitante",
                search: {
                    label: "Usuario solicitante",
                    placeholder: "Busque por nombre o correo",
                    options: nombres.map((n) => ({ value: n, label: n })),
                    vacio: "No hay receptores en el listado actual.",
                },
            },
        ];
    }, [loans]);

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
            scopeOptions={scopeOptions}
            onGenerate={handleGenerate}
        />
    );
}
