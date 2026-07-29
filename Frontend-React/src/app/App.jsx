import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { listenForSessionPings } from "@/shared/services/sessionChannel";

export default function App(){
    // Sesión única entre pestañas (p45): esta pestaña queda escuchando los pings
    // de las demás. Va en App y no en un layout porque debe estar activo tanto en
    // /auth como dentro del dashboard, sin depender de la ruta.
    useEffect(() => listenForSessionPings(), []);

    return <RouterProvider router={router} />;
}
