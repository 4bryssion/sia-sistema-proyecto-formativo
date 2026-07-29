import { getStatusFilterLabel } from "@/shared/reports/statusLabel";
import { DataTable, Button, FilterMenu, usePermissions , ListPageHeader } from "@/shared";
import { UserColumns } from "../table/UserColumns";
import { useUsers } from "../hooks/useUsers";
import ReportConfigModal from "../reports/components/ReportConfigModal";
import ViewUserModal from "../components/ViewUserModal";
import EditUserModal from "../components/EditUserModal";
import { Link } from "react-router-dom";
import { useState } from "react";

// Tipo de usuario = userAccountType del modelo (enum AccountType del backend)
const ACCOUNT_TYPE_FILTER = [
  { value: "Cuentadante", label: "Cuentadante" },
  { value: "Solidario", label: "Solidario" },
];

export default function ListUserPage() {
  const { can } = usePermissions();
  const [status, setStatus] = useState("active");
  const [accountType, setAccountType] = useState(undefined);
  const [isReportOpen, setIsReportOpen] = useState(false);
  // Una sola instancia de cada modal para toda la tabla: las filas solo dicen
  // qué id abrir. Montar un modal por fila multiplicaría los componentes y las
  // peticiones sin ninguna ganancia.
  const [viewUserId, setViewUserId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const { users, loading, error, refetch } = useUsers(status);
  // El SADMIN ya viene excluido por el backend (systemIdentities.js)
  const visibleUsers = users
    // El filtro se aplica sobre los datos ANTES de entregarlos a la tabla, en vez
    // de usar el filtro por columna de TanStack: así el buscador, la paginación y
    // el contador de registros trabajan sobre el conjunto ya filtrado, y DataTable
    // no necesita exponer su instancia interna.
    .filter((u) => !accountType || u.userAccountType === accountType);

  return (
    <div className="p-6">
      <ListPageHeader title="Usuarios">
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
      </ListPageHeader>

      {loading ? (
        <p className="text-gray-600">Cargando usuarios...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable
          data={visibleUsers}
          columns={UserColumns(refetch, can, setViewUserId, setEditUserId)}
          toolbarExtra={
            <FilterMenu
              label="Tipo de usuario"
              value={accountType}
              onChange={setAccountType}
              options={ACCOUNT_TYPE_FILTER}
            />
          }
        />
      )}

      <ReportConfigModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} users={visibleUsers} statusLabel={getStatusFilterLabel(status)} />

      <ViewUserModal
        isOpen={viewUserId != null}
        userId={viewUserId}
        onClose={() => setViewUserId(null)}
        // Editar desde el modal de consulta: se cierra uno y se abre el otro
        onEdit={(id) => { setViewUserId(null); setEditUserId(id); }}
      />

      <EditUserModal
        isOpen={editUserId != null}
        userId={editUserId}
        onClose={() => setEditUserId(null)}
        onSaved={refetch}
      />
    </div>
  );
}
