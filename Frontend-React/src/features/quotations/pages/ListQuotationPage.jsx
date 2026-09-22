import { useState } from "react";
import { DataTable, Button, IconButton, StatusFilterSelect } from "@/shared";
import { quotationColumns } from "../table/QuotationsColumns";
import { useQuotations } from "../hooks/useQuotations";
import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import UploadQuotationsModal from "@/shared/components/quotations/UploadQuotationsModal";

// (p50) Módulo nuevo, sobre el mismo patrón de grupos que siguen marcas,
// inventarios y categorías: cabecera, filtro de estado, botón y tabla.
//
// Lo único que cambia es el botón: aquí no se "crea" nada escribiendo, se CARGA
// un archivo, así que dice "Cargar cotización" y abre el modal de carga.
export default function ListQuotationPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("active");
  const { quotations, loading, error, refetch } = useQuotations(status);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="p-6">

      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="font-main font-semibold mb-0 text-h3 sm:text-h2">Cotizaciones</h1>
        </div>

        <div className="grid sm:flex gap-6 items-center">
          <StatusFilterSelect value={status} onChange={setStatus} />

          <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
            Cargar cotización
          </Button>
        </div>
      </div>

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
