import { DataTable, Button, IconButton, usePermissions } from "@/shared";
import { getTopGroupName } from "../utils/topGroup";
import { UserColumns } from "../table/UserColumns";
import { useUsers } from "../hooks/useUsers";
import ReportConfigModal from "../reports/components/ReportConfigModal";
import { Link, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { useState } from "react";

export default function ListUserPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [status, setStatus] = useState("active");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { users, loading, error, refetch } = useUsers(status);
  // El SuperAdmin no aparece como dato en ningún listado ni reporte
  const visibleUsers = users.filter((u) => getTopGroupName(u) !== "SuperAdmin");

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-4">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">Usuarios</h1>
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

          <Button variant="secondary" onClick={() => setIsReportOpen(true)}>
            Generar Reporte
          </Button>

          {can("create_user") && (
            <Link to="/dashboard/users/create">
              <Button variant="primary">Crear Usuario</Button>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando usuarios...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable data={visibleUsers} columns={UserColumns(refetch, can)} />
      )}

      <ReportConfigModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} users={visibleUsers} />
    </div>
  );
}
