// src/shared/services/axiosInstance.js
// Instancia axios global para módulos de negocio.
// Auth usa fetch nativo — no importar este archivo desde authService.js.

import axios from "axios";
import { Alert } from "../components/utils/alert.js";
import { clearSession } from "@/shared/services/logoutService";
import { setMustChangePassword, getToken } from "@/shared/services/authStorage";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Interceptor de request: adjuntar token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de response: manejar token expirado o inválido (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // (p48) Hay DOS clases de 403 y confundirlas deja al usuario atascado:
      //
      // - Con `mustChangePassword`, el backend está diciendo "cambia primero tu
      //   contraseña temporal", no "no tienes permisos". Se repone el flag en la
      //   sesión (pudo perderse al recargar con otra pestaña) para que el
      //   bloqueo de RequirePasswordChange vuelva a aparecer, y NO se muestra la
      //   alerta de permisos, que aquí sería un mensaje falso.
      // - Cualquier otro 403 sí es autorización real del servidor.
      if (error.response?.data?.mustChangePassword) {
        setMustChangePassword(true);
      } else {
        Alert.error(
          "Acción no permitida",
          error.response?.data?.error ?? "No tienes permisos para realizar esta acción."
        );
      }
    }

    if (error.response?.status === 401) {
      // clearSession (no logout): el token ya fue rechazado, avisar al backend
      // devolvería otro 401 y entraría en bucle. Con sesión única (p45) este 401
      // también ocurre cuando la sesión se cerró desde otro lugar.
      clearSession();
      window.location.href = "/auth"; // Redirige y recarga (limpia estado React)
    }
    return Promise.reject(error);
  }
);

export default api;