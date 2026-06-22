import { DataTable, IconButton } from "@/shared";
import { brandColumns } from "../table/BrandsColumns";
import { brands } from "../data/brands";
import BrandRegisterForm from "../components/BrandRegisterForm";
import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Página principal de marcas: formulario a la izquierda y tabla a la derecha
export default function ListBrandPage() {
    const navigate = useNavigate();

    return (
        <div className="p-2">

            {/* Botón de regreso */}
            <div className="mb-6">
                <IconButton
                    ariaLabel="Devolverse"
                    onClick={() => navigate(-1)}
                    
                >
                    <Undo2 strokeWidth={2.8} />
                </IconButton>
            </div>

            {/* Contenedor principal: panel izquierdo + panel derecho */}
            <div className="grid grid-cols-1 1400:grid-cols-[380px_1fr]">

                {/* Panel izquierdo negro con formulario de crear marca */}
                <div className="bg-black p-16 1400:h-full flex items-center justify-center">
                    <BrandRegisterForm />
                </div>

                {/* Panel derecho blanco con tabla de marcas */}
                <div className="bg-white p-2">
                    <h1 className="text-h2 font-bold mb-6">Marcas</h1>

                    <DataTable
                        data={brands}
                        columns={brandColumns}
                    />
                </div>

            </div>

        </div>
    );
}