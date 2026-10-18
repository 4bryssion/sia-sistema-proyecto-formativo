import { useState } from "react";
import { DataTable, Button, StatusFilterSelect, PermissionGate, ListPageHeader } from "@/shared";
import { categoryColumns } from "../table/CategoriesColumns";
import { useCategories } from "../hooks/useCategories";
import CreateCategoryModal from "@/shared/components/categories/CreateCategoryModal";

// (p50) Módulo nuevo, construido directamente sobre el patrón de grupos —
// cabecera, filtro de estado, botón de crear y tabla — que es el que marcas e
// inventarios acaban de adoptar.
//
// La base de datos, el backend, los cuatro permisos y las tres categorías de
// origen YA existían: lo único que faltaba era esta pantalla.
export default function ListCategoryPage() {
  const [status, setStatus] = useState("active");
  const { categories, loading, error, refetch } = useCategories(status);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6">

      <ListPageHeader title="Categorías">
        <StatusFilterSelect value={status} onChange={setStatus} />

        {/* (p51) El permiso se consulta ANTES, no después: sin el gate el
            botón se veía igual para todos y el "no" llegaba del servidor
            cuando el formulario ya estaba lleno. */}
        <PermissionGate codename="create_category" accion="crear categorías">
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Categoría
          </Button>
        </PermissionGate>
      </ListPageHeader>

      {loading ? (
        <p className="font-secondary text-body text-text-muted">Cargando categorías...</p>
      ) : error ? (
        <p className="font-secondary text-body text-error">{error}</p>
      ) : (
        <DataTable data={categories} columns={categoryColumns(refetch)} />
      )}

      <CreateCategoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={refetch}
      />
    </div>
  );
}
