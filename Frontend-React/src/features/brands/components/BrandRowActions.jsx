import { useState } from "react";
import { Pencil } from "lucide-react";
import { Switch } from "@/shared";
import brandService from "../services/brandService.js";
import EditBrandPage from "../pages/EditBrandPage.jsx";

export default function BrandRowActions({ brand, onChanged }) {

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [toggling, setToggling] = useState(false);

    const handleToggle = async () => {
        setToggling(true);
        try {
            await brandService.toggle(brand.id);
            onChanged?.();
        } catch {
            onChanged?.();
        } finally {
            setToggling(false);
        }
    };

    return (
        <div className="flex items-center gap-3">

            <Switch
                checked={brand.isActive}
                onChange={handleToggle}
                disabled={toggling}
                size="sm"
                className="inline-flex"
            />

            <button
                onClick={() => setIsEditOpen(true)}
                className="p-1 rounded hover:bg-gray-900"
            >
                <Pencil size={16} />
            </button>

            <EditBrandPage
                brand={brand}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSave={onChanged}
            />
        </div>
    );
}
