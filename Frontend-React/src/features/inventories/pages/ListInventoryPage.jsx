import { useState } from "react";
import { DataTable, IconButton, StatusFilterSelect } from "@/shared";
import { inventoryColumns } from "../table/InventoriesColumns";
import { useInventories } from "../hooks/useInventories";
import InventoryRegisterForm from "../components/InventoryRegisterForm";
import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ListInventoryPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("active");
    const { inventories, loading, error, refetch } = useInventories(status);

    return (
        <div className="p-6">

            <div className="mb-6">
                <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
                    <Undo2 strokeWidth={2.8} />
                </IconButton>
            </div>

            <div className="grid grid-cols-1 1400:grid-cols-[380px_1fr]">

                <div className="bg-black p-16 1400:h-full flex items-center justify-center">
                    <InventoryRegisterForm onSuccess={refetch} />
                </div>

                <div className="bg-white p-6">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h1 className="font-main text-h2 font-bold">Inventarios</h1>
                        <StatusFilterSelect value={status} onChange={setStatus} />
                    </div>

                    {loading ? (
                        <p className="font-secondary text-body text-gray-600">Cargando inventarios...</p>
                    ) : error ? (
                        <p className="font-secondary text-body text-error">{error}</p>
                    ) : (
                        <DataTable data={inventories} columns={inventoryColumns(refetch)} />
                    )}
                </div>

            </div>
        </div>
    );
}
