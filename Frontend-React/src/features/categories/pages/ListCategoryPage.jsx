import { useState } from "react";
import { DataTable, Button, IconButton, StatusFilterSelect } from "@/shared";
import { categoryColumns } from "../table/CategoriesColumns";
import { useCategories } from "../hooks/useCategories";
import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import CreateCategoryModal from "@/shared/components/categories/CreateCategoryModal";

// (p50) Módulo nuevo, construido directamente sobre el patrón de grupos —
// cabecera, filtro de estado, botón de crear y tabla — que es el que marcas e
// inventarios acaban de adoptar.
//
// La base de datos, el backend, los cuatro permisos y las tres categorías de
// origen YA existían: lo único que faltaba era esta pantalla.
export default function ListCategoryPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("active");
  const { categories, loading, error, refetch } = useCategories(status);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6">

      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="font-main font-semibold mb-0 text-h3 sm:text-h2">Categorías</h1>
        </div>

        <div className="grid sm:flex gap-6 items-center">
          <StatusFilterSelect value={status} onChange={setStatus} />

          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Categoría
          </Button>
        </div>
      </div>

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
