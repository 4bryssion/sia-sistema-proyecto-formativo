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
// escribir en sessionStorage durante el render es un efecto secundario.

import { useEffect, useState } from "react";
import { logout } from "@/features/auth/services/logoutService";

export default function GuestRoute({ children }) {
  // Se evalúa una sola vez al montar: si se leyera sessionStorage en cada render,
  // el propio logout dispararía otro ciclo y el estado quedaría inconsistente.
  const [closingSession, setClosingSession] = useState(
    () => !!sessionStorage.getItem("token"),
  );

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
