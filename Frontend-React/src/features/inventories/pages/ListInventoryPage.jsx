import { useState } from "react";
import { DataTable, Button, IconButton, StatusFilterSelect } from "@/shared";
import { inventoryColumns } from "../table/InventoriesColumns";
import { useInventories } from "../hooks/useInventories";
import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import CreateInventoryModal from "@/shared/components/inventories/CreateInventoryModal";

// (p50) Estandarizado contra el listado de grupos.
//
// Antes esta pantalla era un panel partido: una columna negra de 380px con el
// formulario de crear incrustado y la tabla al lado. Eso traía tres problemas:
//
//  - Ningún otro módulo del sistema se ve así, de modo que crear aquí no se
//    parecía a crear en ninguna otra parte.
//  - El formulario ocupaba espacio permanente para algo que se usa de vez en
//    cuando, y a cambio le quitaba ancho a la tabla, que es lo que sí se mira.
//  - La franja negra existía solo para que el formulario se distinguiera del
//    fondo; con el formulario en un modal, deja de haber nada que distinguir.
//
// El modal de crear ya existía en shared —lo abre el formulario de materiales
// con "Crear y asignar nueva inventario"—, así que aquí no se construye nada nuevo:
// se reutiliza el mismo, que además garantiza que crear desde el listado y
// crear desde un material se comporten igual.
export default function ListInventoryPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("active");
  const { inventories, loading, error, refetch } = useInventories(status);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6">

      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="font-main font-semibold mb-0 text-h3 sm:text-h2">Inventarios</h1>
        </div>

        <div className="grid sm:flex gap-6 items-center">
          <StatusFilterSelect value={status} onChange={setStatus} />

          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Inventario
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="font-secondary text-body text-text-muted">Cargando inventarios...</p>
      ) : error ? (
        <p className="font-secondary text-body text-error">{error}</p>
      ) : (
        <DataTable data={inventories} columns={inventoryColumns(refetch)} />
      )}

      <CreateInventoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={refetch}
      />
    </div>
  );
}
