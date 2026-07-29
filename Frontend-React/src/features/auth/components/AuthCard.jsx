// Envoltura visual compartida por los pasos de recuperación de contraseña.
//
// Se extrajo porque las tres vistas (correo → código → nueva contraseña) repetían
// exactamente el mismo marcado: fondo, botón de volver, tarjeta blanca, logo,
// título y descripción. Al separarlas en tres rutas, duplicar ese bloque tres
// veces habría hecho que cualquier ajuste visual se tuviera que aplicar 3 veces.

import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import logo from "@/assets/logos/logo-sena-verde.png";
import bg from "@/assets/images/background-oscuro.jpg";
import { IconButton } from "@/shared";

export default function AuthCard({
    title,
    // Texto entre signos ¡! que explica QUÉ se pide en este paso
    description,
    // Aviso secundario opcional, con más peso visual que la descripción
    highlight,
    backTo,
    onSubmit,
    children,
}) {
    const navigate = useNavigate();

    return (
        <div className="relative flex min-h-screen items-center justify-center">
            {/* Fondo con imagen — el mismo del login */}
            <div
                className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{ backgroundImage: `url(${bg})` }}
            />

            {/* Botón volver */}
            <div className="absolute top-6 left-6 text-white">
                <IconButton ariaLabel="Volver" onClick={() => navigate(backTo)} className="text-white hover:bg-white/20">
                    <Undo2 strokeWidth={2.8} />
                </IconButton>
            </div>

            <form
                className="grid gap-4 mx-6 p-8 sm:p-12 justify-items-center max-w-max bg-white border rounded-md my-8"
                onSubmit={onSubmit}
            >
                <img src={logo} alt="logo" className="h-24" />

                <h1 className="text-h3 font-main font-bold text-center">{title}</h1>

                {description && (
                    <p className="font-secondary text-body text-center max-w-xs">
                        {description}
                    </p>
                )}

                {/* Jerarquía: el highlight pesa más que la descripción (text-h3 vs text-body) */}
                {highlight && (
                    <p className="font-secondary text-h3 text-center max-w-xs leading-snug">
                        {highlight}
                    </p>
                )}

                {children}
            </form>
        </div>
    );
}
