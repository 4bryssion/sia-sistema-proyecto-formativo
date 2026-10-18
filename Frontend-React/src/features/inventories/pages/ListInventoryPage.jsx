import { useState } from "react";
import { DataTable, Button, StatusFilterSelect, PermissionGate, ListPageHeader } from "@/shared";
import { inventoryColumns } from "../table/InventoriesColumns";
import { useInventories } from "../hooks/useInventories";
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
  const [status, setStatus] = useState("active");
  const { inventories, loading, error, refetch } = useInventories(status);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6">

      <ListPageHeader title="Inventarios">
        <StatusFilterSelect value={status} onChange={setStatus} />

        {/* (p51) El permiso se consulta ANTES, no después: sin el gate el
            botón se veía igual para todos y el "no" llegaba del servidor
            cuando el formulario ya estaba lleno. */}
        <PermissionGate codename="create_inventory" accion="crear inventarios">
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Inventario
          </Button>
        </PermissionGate>
      </ListPageHeader>

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
