import { getStatusFilterLabel } from "@/shared/reports/statusLabel";
import { Button, DataTable, FilterMenu, usePermissions, ListPageHeader } from "@/shared";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useLoans } from "../hooks/useLoans";
import { loanColumns } from "../table/loanColumns";
import ReportConfigModal from "../reports/components/ReportConfigModal.jsx";
import { LOAN_STATUS_FILTER_OPTIONS } from "../utils/loanStatusLabel";
import { ReturnLoanModal } from "@/features/devolutions";

export default function ListLoanPage() {
  const { can } = usePermissions();
  const [status, setStatus] = useState("active");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // Filtro por estado del préstamo. Igual que en usuarios y materiales, recorta
  // los datos ANTES de entregarlos a la tabla: así el buscador, la paginación,
  // el contador y el reporte trabajan sobre el conjunto ya filtrado.
  const [loanStatus, setLoanStatus] = useState(undefined);
  // Una sola instancia del modal de retorno para toda la tabla: las filas solo
  // dicen qué préstamo abrir
  const [returnLoanId, setReturnLoanId] = useState(null);

  const { loans, loading, error, refetch } = useLoans(status);

  // Sin permiso para listar todos los préstamos, solo se ven aquellos donde participa
  const ownId = JSON.parse(sessionStorage.getItem("user") ?? "null")?.id ?? null;
  const ownLoans = can("list_loans")
    ? loans
    : loans.filter((l) => l.signatures?.some((sig) => Number(sig.userId ?? sig.user?.id) === Number(ownId)));

  const visibleLoans = ownLoans.filter((l) => !loanStatus || l.status === loanStatus);

  return (
    <div className="p-6">
      <ListPageHeader title="Préstamos">
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

        {can("create_loan") && (
          <Link to="/dashboard/loans/create">
            <Button variant="primary">Crear Préstamo</Button>
          </Link>
        )}
      </ListPageHeader>

      {loading ? (
        <p className="text-gray-600">Cargando préstamos...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable
          data={visibleLoans}
          columns={loanColumns(refetch, can, setReturnLoanId)}
          toolbarExtra={
            <FilterMenu
              label="Estado"
              value={loanStatus}
              onChange={setLoanStatus}
              options={LOAN_STATUS_FILTER_OPTIONS}
            />
          }
        />
      )}

      <ReturnLoanModal
        isOpen={returnLoanId != null}
        loanId={returnLoanId}
        onClose={() => setReturnLoanId(null)}
        onSaved={refetch}
      />

      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        loans={visibleLoans}
        statusLabel={getStatusFilterLabel(status)}
      />
    </div>
  );
}
