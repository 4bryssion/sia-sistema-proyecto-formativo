// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { taskReportFields } from "../config/taskReportFields";
import { generateTaskReport } from "../services/generateTaskReport";
import { TASK_STATUS_LABELS } from "../../constants/taskStatus";

// El alcance de tareas no filtra por un texto escrito sino por estado, así que
// no lleva campo de entrada: son opciones cerradas derivadas del enum
const SCOPE_OPTIONS = [
    { value: "all", label: "Todas las tareas" },
    ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
        value,
        label: `Solo ${label.toLowerCase()}`,
    })),
];

export default function TaskReportConfigModal({ isOpen, onClose, tasks = [] }) {
    const handleGenerate = ({ format, selectedFields, scope }) => {
        generateTaskReport({ tasks, format, selectedFields, scope });
    };

    return (
        <ReportConfigModal
            isOpen={isOpen}
            onClose={onClose}
            title="Generar reporte de tareas"
            fields={taskReportFields}
            scopeOptions={SCOPE_OPTIONS}
            onGenerate={handleGenerate}
        />
    );
}
