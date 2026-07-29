import { getStatusFilterLabel } from "@/shared/reports/statusLabel";
import { Button, DataTable, usePermissions , ListPageHeader } from "@/shared";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useLoans } from "../hooks/useLoans";
import { loanColumns } from "../table/loanColumns";
import ReportConfigModal from "../reports/components/ReportConfigModal.jsx";

export default function ListLoanPage() {
  const { can } = usePermissions();
  const [status, setStatus] = useState("active");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { loans, loading, error, refetch } = useLoans(status);

  // Sin permiso para listar todos los préstamos, solo se ven aquellos donde participa
  const ownId = JSON.parse(sessionStorage.getItem("user") ?? "null")?.id ?? null;
  const visibleLoans = can("list_loans")
    ? loans
    : loans.filter((l) => l.signatures?.some((sig) => Number(sig.userId ?? sig.user?.id) === Number(ownId)));

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
        <DataTable data={visibleLoans} columns={loanColumns(refetch, can)} />
      )}

      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        loans={visibleLoans}
        statusLabel={getStatusFilterLabel(status)}
      />
    </div>
  );
}
