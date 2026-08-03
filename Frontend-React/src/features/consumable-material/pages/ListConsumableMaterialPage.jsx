import { getStatusFilterLabel } from "@/shared/reports/statusLabel";
import { Button, DataTable, FilterMenu, usePermissions , ListPageHeader } from "@/shared";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useConsumableMaterials } from "../hooks/useConsumableMaterials";
import { consumableMaterialColumns } from "../table/consumableMaterialColumns";
import { STATUS_FILTER_OPTIONS } from "../utils/statusLabel";
import ReportConfigModal from "../reports/components/ReportConfigModal";
import ViewConsumableMaterialModal from "../components/ViewConsumableMaterialModal";
import EditConsumableMaterialModal from "../components/EditConsumableMaterialModal";

export default function ListConsumableMaterialPage() {
  const { can } = usePermissions();
  const [status, setStatus]                       = useState("active");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2 font-secondary"
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </select>

        <Button variant="secondary" onClick={() => setIsReportModalOpen(true)}>
          Generar Reporte
        </Button>
        {can("create_consumable_material") && (
        <Link to="/dashboard/consumable-materials/create">
          <Button variant="primary">Crear Material</Button>
        </Link>
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

      <EditConsumableMaterialModal
        isOpen={editMaterialId != null}
        materialId={editMaterialId}
        onClose={() => setEditMaterialId(null)}
        onSaved={refetch}
      />
    </div>
  );
}
