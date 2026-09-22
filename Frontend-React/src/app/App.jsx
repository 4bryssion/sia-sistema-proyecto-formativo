import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { startSessionHeartbeat } from "@/shared/services/sessionHeartbeat";
import { onSessionChange, getCurrentUser } from "@/shared/services/authStorage";

export default function App(){
    // (p49) Latido de sesión: mientras esta pestaña exista, el servidor sabe que
    // el navegador sigue abierto. Si se cierra —a propósito o de golpe— dejan de
    // llegar latidos y la sesión se libera sola.
    //
    // Va en App y no en un layout porque debe seguir vivo tanto en /auth como
    // dentro del dashboard, sin depender de la ruta.
    useEffect(() => startSessionHeartbeat(), []);

    // (p49) Sincronía entre pestañas. Con el token en localStorage todas comparten
    // una sola sesión, así que lo que pasa en una tiene que reflejarse en las
    // demás: si en otra pestaña se cierra sesión, esta no puede seguir mostrando
    // datos; y si en otra se entra con OTRA cuenta, esta estaría enseñando los
    // datos de la anterior con el token de la nueva.
    //
    // Se recarga en vez de navegar porque hay estado de React colgando de la
    // sesión anterior (permisos, listados, modales abiertos) que no se limpia
    // solo. La recarga la resuelve entera y luego los guards de ruta deciden.
    //
    // (p50) La recarga solo tiene sentido si ESTA ventana tenía sesión: es su
    // estado el que se queda viejo. Una ventana sin sesión —parada en el login—
    // no tiene nada que limpiar, y recargarla era el primer eslabón de una
    // cadena que terminaba cerrando la sesión recién abierta en otra ventana.
    useEffect(() => {
        const idActual = getCurrentUser()?.id ?? null;
        if (idActual === null) return undefined;
        return onSessionChange(({ token, userId }) => {
            if (!token || userId !== idActual) window.location.reload();
        });
    }, []);

    return <RouterProvider router={router} />;
}
