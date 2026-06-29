import { Button, DataTable, IconButton } from "@/shared";
import { Link, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { useState } from "react";
import { useConsumableMaterials } from "../hooks/useConsumableMaterials";
import { consumableMaterialColumns } from "../table/consumableMaterialColumns";
import ReportConfigModal from "../reports/components/ReportConfigModal";

export default function ListConsumableMaterialPage() {
  const navigate = useNavigate();
  const [status, setStatus]                       = useState("active");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { materials, loading, error, refetch } = useConsumableMaterials(status);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-4">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">
            Materiales Consumibles
          </h1>
        </div>

        <div className="grid sm:flex gap-4 items-center">
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
          <Link to="/dashboard/consumable-materials/create">
            <Button variant="primary">Crear Material</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando materiales...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable data={materials} columns={consumableMaterialColumns(refetch)} />
      )}

      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        materials={materials}
      />
    </div>
  );
}
