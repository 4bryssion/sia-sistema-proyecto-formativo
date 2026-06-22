// src/shared/components/auth/GuestRoute.jsx
// Si el usuario ya tiene sesión activa, lo redirige al dashboard.
// Evita que pueda volver a /auth con la flecha atrás o modificando la URL.

import { Navigate } from "react-router-dom";

export default function GuestRoute({ children }) {
  const token = sessionStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}