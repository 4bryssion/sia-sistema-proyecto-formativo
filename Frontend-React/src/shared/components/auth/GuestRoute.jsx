// src/shared/components/auth/GuestRoute.jsx
//
// Comportamiento (decisión jul-2026, reemplaza al anterior):
// ANTES: con sesión activa, entrar a /auth redirigía al dashboard — es decir, la
// flecha atrás quedaba bloqueada.
// AHORA: llegar a /auth teniendo sesión (flecha atrás o escribiendo la URL)
// CIERRA la sesión y muestra el login. Como el token deja de existir, avanzar de
// nuevo con las flechas ya no devuelve al dashboard: ProtectedRoute rebota a
// /auth. Para volver a entrar hay que autenticarse otra vez.
//
// El cierre va en un efecto y no en el render porque `logout()` es asíncrono
// (avisa al backend para liberar el jti de la sesión única, p45) y porque
// escribir en el almacenamiento durante el render es un efecto secundario.
//
// (p50) Y solo cierra la sesión que ESTA pestaña abrió.
//
// El fallo que arregla: con una pestaña parada en el login y sesión iniciada en
// otra ventana, esta recargaba —o bastaba un F5—, veía el token de la otra en
// localStorage y llamaba a logout(). El backend liberaba el jti de la sesión
// buena y la otra ventana rebotaba al login al instante, sin explicación.
//
// Lo que NO cambia: cerrar sesión a propósito desde la navbar sigue funcionando
// desde cualquier pestaña, el servidor sigue liberando la sesión por falta de
// latido, y la sesión única la sigue imponiendo el backend al iniciar sesión.

import { useEffect, useState } from "react";
import { logout } from "@/shared/services/logoutService";
import { getToken, estaPestanaAbrioLaSesion } from "@/shared/services/authStorage";
import { marcarVentanaEnLogin } from "@/shared/services/sessionHeartbeat";

export default function GuestRoute({ children }) {
  // Se evalúa una sola vez al montar: si se leyera el almacenamiento en cada
  // render, el propio logout dispararía otro ciclo y el estado quedaría
  // inconsistente.
  const [closingSession, setClosingSession] = useState(
    () => !!getToken() && estaPestanaAbrioLaSesion(),
  );

  // (p50) Mientras esta ventana muestre el login, no late ni vigila la sesión:
  // el token de localStorage puede ser de otra ventana que sí la está usando.
  useEffect(() => marcarVentanaEnLogin(), []);

  useEffect(() => {
    if (!closingSession) return;
    // El login se mantiene oculto hasta que la sesión anterior esté cerrada: si no,
    // se podría enviar el formulario mientras el backend aún tiene el jti viejo y
    // respondería 409 ("ya tienes una sesión iniciada") contra el propio usuario.
    logout().finally(() => setClosingSession(false));
  }, [closingSession]);

  if (closingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-secondary text-body text-white">Cerrando sesión...</p>
      </div>
    );
  }

  return children;
}
