import { getStatusFilterLabel } from "@/shared/reports/statusLabel";
import { Button, DataTable, FilterMenu, usePermissions , ListPageHeader, StatusFilterSelect } from "@/shared";
import { useState } from "react";
import { useConsumableMaterials } from "../hooks/useConsumableMaterials";
import { consumableMaterialColumns } from "../table/consumableMaterialColumns";
import { STATUS_FILTER_OPTIONS } from "@/shared/utils/materialStatusLabel";
import ReportConfigModal from "../reports/components/ReportConfigModal";
import ViewConsumableMaterialModal from "../components/ViewConsumableMaterialModal";
import EditConsumableMaterialModal from "../components/EditConsumableMaterialModal";
import CreateConsumableMaterialModal from "../components/CreateConsumableMaterialModal";

export default function ListConsumableMaterialPage() {
  const { can } = usePermissions();
  const [status, setStatus]                       = useState("active");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen]           = useState(false);
  // Filtro por estado del material. Igual que en usuarios, se aplica sobre los
  // datos ANTES de entregarlos a la tabla: así el buscador, la paginación y el
  // contador de registros trabajan sobre el conjunto ya filtrado.
  const [materialStatus, setMaterialStatus]       = useState(undefined);
  // Una sola instancia de cada modal para toda la tabla: las filas solo dicen
  // qué id abrir
  const [viewMaterialId, setViewMaterialId]       = useState(null);
  const [editMaterialId, setEditMaterialId]       = useState(null);

  const { materials, loading, error, refetch } = useConsumableMaterials(status);
  const visibleMaterials = materials.filter(
    (m) => !materialStatus || m.status === materialStatus,
  );

  return (
    <div className="p-6">
      <ListPageHeader title="Materiales Consumibles">
        <StatusFilterSelect value={status} onChange={setStatus} />

        <Button variant="secondary" onClick={() => setIsReportModalOpen(true)}>
          Generar Reporte
        </Button>
        {/* (p49) Crear material dejó de ser una página: es un modal de 5 pasos.
            Al guardar refresca el listado sin navegar a ninguna parte. */}
        {can("create_consumable_material") && (
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Material
          </Button>
        )}
      </ListPageHeader>

      {loading ? (
        <p className="text-gray-600">Cargando materiales...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable
          data={visibleMaterials}
          columns={consumableMaterialColumns(refetch, can, setViewMaterialId, setEditMaterialId)}
          toolbarExtra={
            <FilterMenu
              label="Estado"
              value={materialStatus}
              onChange={setMaterialStatus}
              options={STATUS_FILTER_OPTIONS}
            />
          }
        />
      )}

      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        materials={visibleMaterials}
        statusLabel={getStatusFilterLabel(status)}
      />

      <ViewConsumableMaterialModal
        isOpen={viewMaterialId != null}
        materialId={viewMaterialId}
        onClose={() => setViewMaterialId(null)}
        onEdit={(id) => { setViewMaterialId(null); setEditMaterialId(id); }}
      />

      <CreateConsumableMaterialModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={refetch}
      />

      <EditConsumableMaterialModal
        isOpen={editMaterialId != null}
        materialId={editMaterialId}
        onClose={() => setEditMaterialId(null)}
        onSaved={refetch}
      />
    </div>
  );
}
