import { DataTable, Button, IconButton } from "@/shared";
import { groupColumns } from "../table/groupColumns";
import { groups } from "../data/group";
import { Link, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";

// Página principal de listado de grupos
export default function ListGroupPage() {

    const navigate = useNavigate();

    return (
        <div className="p-6">

            <div className="flex justify-between mb-6">

                <div className="flex items-center gap-2">

                    {/* Botón para regresar a la página anterior */}
                    <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
                        <Undo2 strokeWidth={2.8} />
                    </IconButton>

                    <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">
                        Grupos
                    </h1>
                </div>

                <div className="grid sm:flex gap-12 items-center">

                    {/* Botón crear grupo - pendiente definir con el LT */}
                    <Link to="/dashboard/groups/create">
                        <Button variant="primary">
                            Crear Grupo
                        </Button>
                    </Link>

                </div>
            </div>

            {/* Tabla de grupos */}
            <DataTable
                data={groups}
                columns={groupColumns}
            />

        </div>
    );
}