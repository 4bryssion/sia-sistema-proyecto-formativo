// Configuración del reporte de tareas.
//
// Usa el Modal compartido en vez de repetir el overlay a mano como los otros
// cuatro ReportConfigModal del proyecto (esos siguen con su marcado propio;
// migrarlos es un paso aparte para no mezclarlo con esta entrega).

import { useState } from "react";
import { Modal, Button, Select, Checkbox } from "@/shared";
import { taskReportFields } from "../config/taskReportFields";
import { generateTaskReport } from "../services/generateTaskReport";
import { TASK_STATUS_LABELS } from "../../constants/taskStatus";

const SCOPE_OPTIONS = [
  { value: "all", label: "Todas las tareas" },
  ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
    value,
    label: `Solo ${label.toLowerCase()}`,
  })),
];

export default function ReportConfigModal({ isOpen, onClose, tasks = [] }) {
  const [format, setFormat] = useState("pdf");
  const [scope, setScope] = useState("all");
  const [selectedFields, setSelectedFields] = useState(
    () => taskReportFields.filter((f) => f.default),
  );

  const handleFieldToggle = (field) => {
    setSelectedFields((prev) =>
      prev.some((f) => f.key === field.key)
        ? prev.filter((f) => f.key !== field.key)
        : [...prev, field],
    );
  };

  const handleGenerate = () => {
    // generateReport devuelve false y avisa cuando no hay filas; en ese caso el
    // modal se queda abierto para que se pueda cambiar el alcance
    const ok = generateTaskReport({ tasks, format, selectedFields, scope });
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generar reporte de tareas"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={selectedFields.length === 0}
          >
            Generar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 justify-items-center sm:justify-items-stretch">
        <Select
          label="Formato del reporte"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          options={[
            { value: "pdf", label: "PDF" },
            { value: "excel", label: "Excel" },
          ]}
        />

        <Select
          label="Alcance del reporte"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          options={SCOPE_OPTIONS}
        />

        <div className="w-full">
          <p className="font-secondary text-caption text-text-muted mb-2">
            Campos del reporte
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {taskReportFields.map((field) => (
              <Checkbox
                key={field.key}
                id={`task-report-${field.key}`}
                name={field.key}
                label={field.label}
                labelClassName="text-medium"
                checked={selectedFields.some((f) => f.key === field.key)}
                onChange={() => handleFieldToggle(field)}
              />
            ))}
          </div>
          {selectedFields.length === 0 && (
            <p className="font-secondary text-caption text-error mt-2">
              Selecciona al menos un campo.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
