// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import { useState, useEffect } from "react";
import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { returnableReportFields } from "../config/returnableReportFields";
import { generateReturnableReport } from "../services/generateReturnableReport";
import inventoryService from "@/shared/services/inventoryService";

const SCOPE_OPTIONS = [
    { value: "all", label: "Todos los materiales" },
    {
        value: "placa_sena",
        label: "Filtrar por placa SENA",
        input: { label: "Placa SENA", placeholder: "Ingrese la placa SENA" },
    },
];

export default function ReturnableReportConfigModal({ isOpen, onClose, materials = [], statusLabel }) {
    const [inventoryOptions, setInventoryOptions] = useState([]);

    // status "all": mismo motivo que en consumibles — el reporte puede cubrir
    // material de un inventario desactivado después
    useEffect(() => {
        if (!isOpen) return;
        inventoryService.getAll({ status: "all" })
            .then((inv) => setInventoryOptions(inv.map((i) => ({ value: String(i.id), label: i.inventoryName }))))
            .catch(() => {});
    }, [isOpen]);

    const handleGenerate = ({ format, selectedFields, scope, scopeValue, inventoryIds }) => {
        generateReturnableReport({
            materials,
            format,
            selectedFields,
            scope,
            documentNumber: scopeValue,
            statusLabel,
            inventoryIds,
            inventoryLabels: inventoryOptions
                .filter((o) => inventoryIds.includes(o.value))
                .map((o) => o.label),
        });
    };

    return (
        <ReportConfigModal
            isOpen={isOpen}
            onClose={onClose}
            title="Generar reporte de materiales devolutivos"
            fields={returnableReportFields}
            scopeOptions={SCOPE_OPTIONS}
            inventoryOptions={inventoryOptions}
            onGenerate={handleGenerate}
        />
    );
}
