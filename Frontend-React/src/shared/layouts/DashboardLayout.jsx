import { Link, Outlet } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { Navbar } from "@/shared";

import {
    IconButton
} from "@/shared";

export default function DashboardLayout(){
    return(
        <div
            className="
                relative min-h-screen text-text-primary pb-4
            "
        >
            {/* Fondo */}
            <div
                className="
                    absolute inset-0 -z-10 bg-cover bg-center bg-(--color-cuaternario-400)
                "
            />

            <Navbar />

            {/* Contenido dinámico de las páginas  */}
            <main>
                <Outlet/>
            </main>

        </div>
    );
}