import { useState } from "react";
import { Pencil } from "lucide-react";
import { Switch, Alert, usePermissions } from "@/shared";
import brandService from "../services/brandService.js";
import EditBrandPage from "../pages/EditBrandPage.jsx";

export default function BrandRowActions({ brand, onChanged }) {
  const { can } = usePermissions();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [toggling, setToggling] = useState(false);

    const handleToggle = async () => {
        // Confirmación obligatoria antes de activar/desactivar (soft-delete)
        const result = await Alert.warning(
            `¿${brand.isActive ? "Desactivar" : "Activar"} marca?`,
            `"${brand.brandName}" quedará ${brand.isActive ? "inactiva" : "activa nuevamente"}.`
        );
        if (!result.isConfirmed) return;
        setToggling(true);
        try {
            await brandService.toggle(brand.id);
            Alert.success(`Marca ${brand.isActive ? "desactivada" : "activada"}`);
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

            {can("toggle_brand") && (
            <Switch
                checked={brand.isActive}
                onChange={handleToggle}
                disabled={toggling}
                size="sm"
                className="inline-flex"
            />
            )}

            {can("edit_brand") && (
            <button
                onClick={() => setIsEditOpen(true)}
                className="p-1 rounded hover:bg-gray-900"
            >
                <Pencil size={16} />
            </button>
            )}

            <EditBrandPage
                brand={brand}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSave={onChanged}
            />
        </div>
    );
}
