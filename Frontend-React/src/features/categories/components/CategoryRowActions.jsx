import { useState } from "react";
import { Pencil } from "lucide-react";
import { Switch, Alert, usePermissions, IconButton } from "@/shared";
import categoryService from "@/shared/services/categoryService";
import EditCategoryModal from "../pages/EditCategoryModal.jsx";

export default function CategoryRowActions({ category, onChanged }) {
  const { can } = usePermissions();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    // Confirmación obligatoria antes de activar/desactivar (soft-delete).
    // Se advierte lo que NO pasa: los materiales asignados conservan su
    // categoría; lo que se pierde es la opción al crear o editar material.
    const result = await Alert.warning(
      `¿${category.isActive ? "Desactivar" : "Activar"} categoría?`,
      category.isActive
        ? `"${category.categoryName}" dejará de ofrecerse al crear o editar materiales devolutivos. Los materiales que ya la tienen asignada la conservan.`
        : `"${category.categoryName}" volverá a ofrecerse al crear o editar materiales devolutivos.`,
    );
    if (!result.isConfirmed) return;

    setToggling(true);
    try {
      const actualizada = await categoryService.toggle(category.id);
      // El backend devuelve cuántos materiales conserva: se dice, porque
      // "desactivada" a secas no aclara qué pasó con ellos.
      const conservados = actualizada?.data?.materialesAsignados ?? actualizada?.materialesAsignados ?? 0;
      Alert.success(
        `Categoría ${category.isActive ? "desactivada" : "activada"}`,
        category.isActive && conservados > 0
          ? `Conserva ${conservados} material(es) asignado(s).`
          : "",
      );
      onChanged?.();
    } catch (err) {
      Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
      onChanged?.();
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center gap-3">

      {can("toggle_category") && (
        <Switch
          checked={category.isActive}
          onChange={handleToggle}
          disabled={toggling}
          size="sm"
          className="inline-flex"
        />
      )}

      {can("edit_category") && (
        <IconButton ariaLabel="Editar categoría" hitSize={36} iconSize={16} onClick={() => setIsEditOpen(true)}>
          <Pencil size={16} />
        </IconButton>
      )}

      <EditCategoryModal
        category={category}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={onChanged}
      />
    </div>
  );
}
