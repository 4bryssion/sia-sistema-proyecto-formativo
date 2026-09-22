// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import { useState, useEffect, useMemo } from "react";
import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { returnableReportFields } from "../config/returnableReportFields";
import { generateReturnableReport } from "../services/generateReturnableReport";
import inventoryService from "@/shared/services/inventoryService";

export default function ReturnableReportConfigModal({ isOpen, onClose, materials = [], statusLabel }) {
    const [inventoryOptions, setInventoryOptions] = useState([]);

    // (p50) La placa SENA se elige de una lista con buscador. El filtro compara
    // la placa EXACTA, así que escrita a mano un carácter de más devolvía un
    // reporte vacío sin explicar por qué.
    //
    // Solo entran los materiales que TIENEN placa: la placa identifica una
    // unidad concreta, y el material por lotes no la lleva. Ofrecer los que no
    // la tienen sería ofrecer opciones vacías.
    //
    // En devolutivos la placa cuelga de la tabla PADRE, como el resto de lo
    // común al material: por eso se lee de `consumableMaterial`, igual que hace
    // el filtro del reporte.
    const scopeOptions = useMemo(() => [
        { value: "all", label: "Todos los materiales" },
        {
            value: "placa_sena",
            label: "Filtrar por placa SENA",
            search: {
                label: "Placa SENA",
                placeholder: "Busque por placa o nombre del material",
                options: materials
                    .filter((m) => m.consumableMaterial?.senaPlate)
                    .map((m) => ({
                        value: String(m.consumableMaterial.senaPlate),
                        label: `${m.consumableMaterial.senaPlate} — ${m.consumableMaterial.materialName}`,
                    })),
                vacio: "Ningún material del listado actual tiene placa SENA.",
            },
        },
    ], [materials]);

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
            scopeOptions={scopeOptions}
            inventoryOptions={inventoryOptions}
            onGenerate={handleGenerate}
        />
    );
}
