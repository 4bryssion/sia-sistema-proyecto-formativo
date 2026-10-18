import { getStatusFilterLabel } from "@/shared/reports/statusLabel";
import { Button, Checkbox, DataTable, FilterMenu, usePermissions, PermissionGate, ListPageHeader, StatusFilterSelect } from "@/shared";
import { useMemo, useState } from "react";
import { useLoans } from "../hooks/useLoans";
import { loanColumns } from "../table/loanColumns";
import ViewLoanModal from "../components/ViewLoanModal";
import EditLoanModal from "../components/EditLoanModal";
import CreateLoanModal from "../components/CreateLoanModal";
import ReportConfigModal from "../reports/components/ReportConfigModal.jsx";
import { LOAN_STATUS_FILTER_OPTIONS } from "../utils/loanStatusLabel";
import ReturnLoanModal from "@/shared/components/devolutions/ReturnLoanModal";
import AuthorizeDevolutionModal from "@/shared/components/devolutions/AuthorizeDevolutionModal";
import { useDevolutions } from "@/shared/hooks/useDevolutions";

export default function ListLoanPage() {
  const { can } = usePermissions();
  const [status, setStatus] = useState("active");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
  // (p52) Solo se piden si quien mira puede verlas. El backend las protege con
  // `list_loan_returns`, que no es el permiso de esta pantalla.
  const { devolutions, refetch: refetchDevolutions } = useDevolutions(
    "active",
    can("list_loan_returns"),
  );

  const refrescarTodo = () => { refetch(); refetchDevolutions(); };

  // (p51) El recorte lo hace el BACKEND: `list_all_loans` decide si la consulta
  // devuelve los préstamos de todo el mundo o solo los del usuario. El filtro que
  // había aquí no servía de nada —el invitado tiene `list_loans`, así que entraba
  // por la rama de "ver todo"— y aunque hubiera estado bien escrito, filtrar en
  // la pantalla no impide pedir los datos al API a mano. Es el RFINV11.

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
    ...(verPrestamos ? loans.map((l) => ({ ...l, statusKey: l.status })) : []),
  ];
  const visibleLoans = filas.filter((f) => !loanStatus || f.statusKey === loanStatus);

  return (
    <div className="p-6">
      <ListPageHeader title="Préstamos">
        <StatusFilterSelect value={status} onChange={setStatus} />

        {/* (p51) El boton no desaparece sin permiso: se ve en gris y al pulsarlo
            dice por que no se puede. Antes no consultaba el permiso en
            absoluto y el reporte se generaba igual. */}
        <PermissionGate codename="report_loans" accion="generar el reporte de préstamos">
          <Button variant="secondary" onClick={() => setIsReportModalOpen(true)}>
            Generar Reporte
          </Button>
        </PermissionGate>

        {/* (p49) Crear préstamo dejó de ser una página: es un modal por pasos.
            Al guardar refresca el listado sin navegar a ninguna parte. */}
        {can("create_loan") && (
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Préstamo
          </Button>
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

      <CreateLoanModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={refrescarTodo}
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
        isOpen={isReportModalOpen && can("report_loans")}
        onClose={() => setIsReportModalOpen(false)}
        loans={visibleLoans.filter((f) => !f.__devolution)}
        statusLabel={getStatusFilterLabel(status)}
      />
    </div>
  );
}
