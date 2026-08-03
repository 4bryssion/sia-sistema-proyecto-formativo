// Cabecera de las páginas de listado: flecha de volver + título + acciones.
//
// Los cinco listados (usuarios, consumibles, devolutivos, préstamos, tareas)
// repetían el mismo marcado con `flex justify-between`, que a partir de ~640px
// no cabe: título largo + selector de estado + "Generar Reporte" + "Crear X"
// suman más ancho que la pantalla y el último botón se desbordaba.
//
// Aquí las acciones se apilan bajo el título hasta md y, cuando van en línea,
// pueden envolverse (flex-wrap). Así ningún botón se sale, ni al añadir uno más
// en el futuro.

import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "./IconButton";

export default function ListPageHeader({ title, onBack, children }) {
    const navigate = useNavigate();

    return (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-3 min-w-0">
                <IconButton
                    ariaLabel="Devolverse"
                    onClick={onBack ?? (() => navigate(-1))}
                    className="shrink-0"
                >
                    <Undo2 strokeWidth={2.8} />
                </IconButton>

                {/* truncate + min-w-0: un título largo empuja a las acciones fuera
                    de la pantalla en vez de recortarse, si no se limita */}
                <h1 className="font-main text-h3 sm:text-h2 font-bold truncate">
                    {title}
                </h1>
            </div>

            {/* flex-wrap: las acciones bajan de línea antes que desbordarse */}
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
                {children}
            </div>
        </div>
    );
}
