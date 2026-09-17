// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import { useState, useEffect } from "react";
import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { consumableReportFields } from "../config/consumableReportFields";
import { generateConsumableReport } from "../services/generateConsumableReport";
import inventoryService from "@/shared/services/inventoryService";

const SCOPE_OPTIONS = [
    { value: "all", label: "Todos los materiales" },
    {
        value: "placa_sena",
        label: "Filtrar por placa SENA",
        input: { label: "Placa SENA", placeholder: "Ingrese la placa SENA" },
    },
];

export default function ConsumableReportConfigModal({ isOpen, onClose, materials = [], statusLabel }) {
    const [inventoryOptions, setInventoryOptions] = useState([]);

    // status "all": un reporte puede cubrir material que está en un inventario
    // desactivado después. Filtrarlos aquí dejaría filas fuera sin explicación.
    // El setState va dentro del then, no en el cuerpo del efecto.
    useEffect(() => {
        if (!isOpen) return;
        inventoryService.getAll({ status: "all" })
            .then((inv) => setInventoryOptions(inv.map((i) => ({ value: String(i.id), label: i.inventoryName }))))
            .catch(() => {});
    }, [isOpen]);

    const handleGenerate = ({ format, selectedFields, scope, scopeValue, inventoryIds }) => {
        generateConsumableReport({
            materials,
            format,
            selectedFields,
            scope,
            documentNumber: scopeValue,
            statusLabel,
            inventoryIds,
            // Los nombres, para que el encabezado del reporte diga sobre qué
            // inventarios se hizo
            inventoryLabels: inventoryOptions
                .filter((o) => inventoryIds.includes(o.value))
                .map((o) => o.label),
        });
    };

    return (
        <ReportConfigModal
            isOpen={isOpen}
            onClose={onClose}
            title="Generar reporte de materiales de consumo"
            fields={consumableReportFields}
            scopeOptions={SCOPE_OPTIONS}
            inventoryOptions={inventoryOptions}
            onGenerate={handleGenerate}
        />
    );
}
