import { getStatusFilterLabel } from "@/shared/reports/statusLabel";
import { DataTable, Button, FilterMenu, usePermissions, ListPageHeader } from "@/shared";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useReturnableMaterials } from "../hooks/useReturnableMaterials";
import { returnableMaterialColumns } from "../table/returnableMaterialColumns";
import { STATUS_FILTER_OPTIONS } from "../utils/statusLabel";
import ReportConfigModal from "../reports/components/ReportConfigModal";
import ViewReturnableMaterialModal from "../components/ViewReturnableMaterialModal";
import EditReturnableMaterialModal from "../components/EditReturnableMaterialModal";

export default function ListReturnableMaterialPage() {
  const { can } = usePermissions();
  const [status, setStatus]                       = useState("active");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // Filtro por estado del material. Igual que en usuarios y consumibles, se
  // aplica sobre los datos ANTES de entregarlos a la tabla: así el buscador, la
  // paginación, el contador y el reporte trabajan sobre el conjunto ya filtrado.
  const [materialStatus, setMaterialStatus]       = useState(undefined);
  // Una sola instancia de cada modal para toda la tabla: las filas solo dicen
  // qué id abrir
  const [viewMaterialId, setViewMaterialId]       = useState(null);
  const [editMaterialId, setEditMaterialId]       = useState(null);

  const { materials, loading, error, refetch } = useReturnableMaterials(status);
  // El estado del material vive en el registro padre (consumableMaterial), no
  // en la fila de devolutivo
  const visibleMaterials = materials.filter(
    (m) => !materialStatus || m.consumableMaterial?.status === materialStatus,
  );

  return (
    <div className="p-6">
      <ListPageHeader title="Materiales Devolutivos">
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
        {can("create_returnable_material") && (
        <Link to="/dashboard/returnable-materials/create">
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
          columns={returnableMaterialColumns(refetch, can, setViewMaterialId, setEditMaterialId)}
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

      <ViewReturnableMaterialModal
        isOpen={viewMaterialId != null}
        materialId={viewMaterialId}
        onClose={() => setViewMaterialId(null)}
        onEdit={(id) => { setViewMaterialId(null); setEditMaterialId(id); }}
      />

      <EditReturnableMaterialModal
        isOpen={editMaterialId != null}
        materialId={editMaterialId}
        onClose={() => setEditMaterialId(null)}
        onSaved={refetch}
      />
    </div>
  );
}
