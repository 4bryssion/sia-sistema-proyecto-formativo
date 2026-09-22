import { useState } from "react";
import { Pencil } from "lucide-react";
import { Switch, Alert, usePermissions, IconButton } from "@/shared";
import inventoryService from "@/shared/services/inventoryService";
import EditInventoryPage from "../pages/EditInventoryPage.jsx";

export default function InventoryRowActions({ inventory, onChanged }) {
  const { can } = usePermissions();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [toggling, setToggling] = useState(false);

    const handleToggle = async () => {
        // Confirmación obligatoria antes de activar/desactivar (soft-delete).
        // Se advierte lo que NO pasa: los materiales asignados conservan su
        // inventario; lo que se pierde es la opción al crear o editar material.
        const result = await Alert.warning(
            `¿${inventory.isActive ? "Desactivar" : "Activar"} inventario?`,
            inventory.isActive
                ? `"${inventory.inventoryName}" dejará de ofrecerse al crear o editar materiales. Los materiales que ya lo tienen asignado lo conservan.`
                : `"${inventory.inventoryName}" volverá a ofrecerse al crear o editar materiales.`
        );
        if (!result.isConfirmed) return;
        setToggling(true);
        try {
            await inventoryService.toggle(inventory.id);
            Alert.success(`Inventario ${inventory.isActive ? "desactivado" : "activado"}`);
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

            {can("toggle_inventory") && (
            <Switch
                checked={inventory.isActive}
                onChange={handleToggle}
                disabled={toggling}
                size="sm"
                className="inline-flex"
            />
            )}

            {can("edit_inventory") && (
            <IconButton ariaLabel="Editar inventario" hitSize={36} iconSize={16} onClick={() => setIsEditOpen(true)}>
                <Pencil size={16} />
            </IconButton>
            )}

            <EditInventoryPage
                inventory={inventory}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSave={onChanged}
            />
        </div>
    );
}
