import { getStatusFilterLabel } from "@/shared/reports/statusLabel";
import { Button, Checkbox, DataTable, FilterMenu, usePermissions, ListPageHeader, StatusFilterSelect } from "@/shared";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useLoans } from "../hooks/useLoans";
import { loanColumns } from "../table/loanColumns";
import ViewLoanModal from "../components/ViewLoanModal";
import EditLoanModal from "../components/EditLoanModal";
import ReportConfigModal from "../reports/components/ReportConfigModal.jsx";
import { LOAN_STATUS_FILTER_OPTIONS } from "../utils/loanStatusLabel";
import ReturnLoanModal from "@/shared/components/devolutions/ReturnLoanModal";
import AuthorizeDevolutionModal from "@/shared/components/devolutions/AuthorizeDevolutionModal";
import { useDevolutions } from "@/shared/hooks/useDevolutions";

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
  const [autorizando, setAutorizando] = useState(null);
  const [viewLoanId, setViewLoanId] = useState(null);
  // Qué conjuntos se listan. Al entrar solo préstamos: es la vista de trabajo
  // habitual. Las devoluciones autorizadas solo se ven al pedirlas, porque son
  // histórico y su efecto ya está reflejado en el préstamo.
  const [verPrestamos, setVerPrestamos] = useState(true);
  const [verDevoluciones, setVerDevoluciones] = useState(false);
  const [editLoanId, setEditLoanId] = useState(null);

  const { loans, loading, error, refetch } = useLoans(status);
  // Las solicitudes de devolución se listan junto a los préstamos: el
  // requerimiento pide que la devolución en espera se vea como un registro más
  const { devolutions, refetch: refetchDevolutions } = useDevolutions("active");

  const refrescarTodo = () => { refetch(); refetchDevolutions(); };

  // Sin permiso para listar todos los préstamos, solo se ven aquellos donde participa
  const ownId = JSON.parse(sessionStorage.getItem("user") ?? "null")?.id ?? null;
  const ownLoans = can("list_loans")
    ? loans
    : loans.filter((l) => l.signatures?.some((sig) => Number(sig.userId ?? sig.user?.id) === Number(ownId)));

  // Una devolución se muestra como fila con los datos de SU préstamo (usuario,
  // grupo, fecha) y su propio estado y materiales.
  //
  // Con la casilla de devoluciones marcada entran también las AUTORIZADAS: es el
  // único sitio donde se puede consultar el estado que dio el autorizador para
  // los materiales por cantidad, que no se escribe sobre el material.
  const devolutionRows = useMemo(
    () =>
      devolutions
        .filter((d) => d.loan)
        .map((d) => ({
          ...d.loan,
          // id único dentro de la tabla: el del préstamo ya lo usa su propia fila
          id: `devolucion-${d.id}`,
          statusKey:
            d.status === "Autorizada"
              ? `Devolucion_${d.type}_Autorizada`
              : `Devolucion_${d.type}`,
          __devolution: d,
        })),
    [devolutions],
  );

  const filas = [
    ...(verDevoluciones ? devolutionRows : []),
    ...(verPrestamos ? ownLoans.map((l) => ({ ...l, statusKey: l.status })) : []),
  ];
  const visibleLoans = filas.filter((f) => !loanStatus || f.statusKey === loanStatus);

  return (
    <div className="p-6">
      <ListPageHeader title="Préstamos">
        <StatusFilterSelect value={status} onChange={setStatus} />

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
          // Las dos casillas van a la izquierda del selector de filas.
          // No se puede desmarcar la última: la tabla nunca queda vacía por un
          // filtro que el usuario podría leer como un fallo.
          pageSizeExtra={
            <div className="flex items-center gap-4">
              <Checkbox
                id="ver-prestamos"
                label="Préstamos"
                checked={verPrestamos}
                onChange={(e) => (e.target.checked || verDevoluciones) && setVerPrestamos(e.target.checked)}
                labelClassName="font-secondary text-medium"
              />
              <Checkbox
                id="ver-devoluciones"
                label="Devoluciones"
                checked={verDevoluciones}
                onChange={(e) => (e.target.checked || verPrestamos) && setVerDevoluciones(e.target.checked)}
                labelClassName="font-secondary text-medium"
              />
            </div>
          }
          columns={loanColumns(refrescarTodo, can, {
            onView: setViewLoanId,
            onEdit: setEditLoanId,
            onReturn: setReturnLoanId,
            onAuthorize: setAutorizando,
          })}
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

      <ViewLoanModal
        isOpen={viewLoanId != null}
        loanId={viewLoanId}
        onClose={() => setViewLoanId(null)}
        onEdit={(id) => { setViewLoanId(null); setEditLoanId(id); }}
      />

      <EditLoanModal
        isOpen={editLoanId != null}
        loanId={editLoanId}
        onClose={() => setEditLoanId(null)}
        onSaved={refrescarTodo}
      />

      <ReturnLoanModal
        isOpen={returnLoanId != null}
        loanId={returnLoanId}
        onClose={() => setReturnLoanId(null)}
        onSaved={refrescarTodo}
      />

      <AuthorizeDevolutionModal
        isOpen={autorizando != null}
        devolution={autorizando}
        onClose={() => setAutorizando(null)}
        onSaved={refrescarTodo}
      />

      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        loans={visibleLoans.filter((f) => !f.__devolution)}
        statusLabel={getStatusFilterLabel(status)}
      />
    </div>
  );
}
