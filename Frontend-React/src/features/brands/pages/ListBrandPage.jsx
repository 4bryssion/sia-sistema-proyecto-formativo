import { DataTable, IconButton } from "@/shared";
import { brandColumns } from "../table/BrandsColumns";
import { useBrands } from "../hooks/useBrands";
import BrandRegisterForm from "../components/BrandRegisterForm";
import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ListBrandPage() {
    const navigate = useNavigate();
    const { brands, loading, error, refetch } = useBrands();

    return (
        <div className="p-2">

            <div className="mb-6">
                <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
                    <Undo2 strokeWidth={2.8} />
                </IconButton>
            </div>

            <div className="grid grid-cols-1 1400:grid-cols-[380px_1fr]">

                <div className="bg-black p-16 1400:h-full flex items-center justify-center">
                    <BrandRegisterForm onSuccess={refetch} />
                </div>

                <div className="bg-white p-2">
                    <h1 className="text-h2 font-bold mb-6">Marcas</h1>

                    {loading ? (
                        <p className="text-gray-600">Cargando marcas...</p>
                    ) : error ? (
                        <p className="text-error">{error}</p>
                    ) : (
                        <DataTable data={brands} columns={brandColumns(refetch)} />
                    )}
                </div>

            </div>
        </div>
    );
}
