import { useState } from "react";
import { DataTable, Button, StatusFilterSelect, PermissionGate, ListPageHeader } from "@/shared";
import { quotationColumns } from "../table/QuotationsColumns";
import { useQuotations } from "../hooks/useQuotations";
import UploadQuotationsModal from "@/shared/components/quotations/UploadQuotationsModal";

// (p50) Módulo nuevo, sobre el mismo patrón de grupos que siguen marcas,
// inventarios y categorías: cabecera, filtro de estado, botón y tabla.
//
// Lo único que cambia es el botón: aquí no se "crea" nada escribiendo, se CARGA
// un archivo, así que dice "Cargar cotización" y abre el modal de carga.
export default function ListQuotationPage() {
  const [status, setStatus] = useState("active");
  const { quotations, loading, error, refetch } = useQuotations(status);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="p-6">

      <ListPageHeader title="Cotizaciones">
        <StatusFilterSelect value={status} onChange={setStatus} />

        {/* (p51) El permiso se consulta ANTES, no después: sin el gate el
            botón se veía igual para todos y el "no" llegaba del servidor
            cuando el formulario ya estaba lleno. */}
        <PermissionGate codename="create_quotation" accion="cargar cotizaciones">
          <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
            Cargar cotización
          </Button>
        </PermissionGate>
      </ListPageHeader>

      {loading ? (
        <p className="font-secondary text-body text-text-muted">Cargando cotizaciones...</p>
      ) : error ? (
        <p className="font-secondary text-body text-error">{error}</p>
      ) : (
        <DataTable data={quotations} columns={quotationColumns(refetch)} />
      )}

      <UploadQuotationsModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSave={refetch}
      />
    </div>
  );
}
