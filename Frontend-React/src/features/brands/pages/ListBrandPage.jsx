import { DataTable } from "@/shared";
import { brandColumns } from "../table/BrandsColumns";
import { brands } from "../data/brands";
import BrandRegisterForm from "../components/BrandRegisterForm";

// Página principal de marcas: formulario a la izquierda y tabla a la derecha
export default function ListBrandPage() {
    return (
        <div className="p-6 grid 1400:grid-cols-[380px_1fr]">

            {/* Panel izquierdo negro con formulario de crear marca */}
            <div className="bg-black p-16 1400:h-full flex items-center justify-center">
                <BrandRegisterForm />
            </div>
            

            {/* Panel derecho blanco con tabla de marcas */}
            <div className="bg-white p-6">
                <h1 className="text-h2 font-bold mb-6">Marcas</h1>
                
                <DataTable
                    data={brands}
                    columns={brandColumns}
                />
            </div>

        </div>
    );
}