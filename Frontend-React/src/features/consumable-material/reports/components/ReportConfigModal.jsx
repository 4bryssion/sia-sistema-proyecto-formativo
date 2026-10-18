// Envoltorio del modal compartido de reportes
// (shared/components/reports/ReportConfigModal). Aquí solo vive lo propio del
// módulo: sus campos, su alcance y a qué generador llamar. El formulario —
// formato, casillas de campos, alcance y botones— es el mismo para los cinco
// módulos y estaba copiado cinco veces.

import { useState, useEffect, useMemo } from "react";
import ReportConfigModal from "@/shared/components/reports/ReportConfigModal";
import { consumableReportFields } from "../config/consumableReportFields";
import { generateConsumableReport } from "../services/generateConsumableReport";
import inventoryService from "@/shared/services/inventoryService";
import { usePermissions } from "@/shared";

export default function ConsumableReportConfigModal({ isOpen, onClose, materials = [], statusLabel }) {
    const { can } = usePermissions();

    // (p51) El filtro por inventarios solo se ofrece a quien puede listarlos.
    // Antes se pedían siempre, y a quien no tenía `list_inventories` el
    // servidor le respondía 403: el interceptor de axios le mostraba
    // "Acción no permitida" encima de un modal que se abría igual y generaba
    // el reporte igual. El aviso no venía del reporte, pero parecía que sí.
    const puedeFiltrarPorInventario = can("list_inventories");
    const [inventoryOptions, setInventoryOptions] = useState([]);

    // (p50) La placa SENA se elige de una lista con buscador. El filtro compara
    // la placa EXACTA, así que escrita a mano un carácter de más devolvía un
    // reporte vacío sin explicar por qué.
    //
    // Solo entran los materiales que TIENEN placa: la placa identifica una
    // unidad concreta, y el material por lotes no la lleva. Ofrecer los que no
    // la tienen sería ofrecer opciones vacías.
    const scopeOptions = useMemo(() => [
        { value: "all", label: "Todos los materiales" },
        {
            value: "placa_sena",
            label: "Filtrar por placa SENA",
            search: {
                label: "Placa SENA",
                placeholder: "Busque por placa o nombre del material",
                options: materials
                    .filter((m) => m.senaPlate)
                    .map((m) => ({
                        value: String(m.senaPlate),
                        label: `${m.senaPlate} — ${m.materialName}`,
                    })),
                vacio: "Ningún material del listado actual tiene placa SENA.",
            },
        },
    ], [materials]);

    // status "all": un reporte puede cubrir material que está en un inventario
    // desactivado después. Filtrarlos aquí dejaría filas fuera sin explicación.
    // El setState va dentro del then, no en el cuerpo del efecto.
    useEffect(() => {
        if (!isOpen) return;
        if (!puedeFiltrarPorInventario) return;
        inventoryService.getAll({ status: "all" })
            .then((inv) => setInventoryOptions(inv.map((i) => ({ value: String(i.id), label: i.inventoryName }))))
            .catch(() => {});
    }, [isOpen, puedeFiltrarPorInventario]);

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
            scopeOptions={scopeOptions}
            inventoryOptions={puedeFiltrarPorInventario ? inventoryOptions : undefined}
            onGenerate={handleGenerate}
        />
    );
}
