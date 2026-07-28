// src/shared/services/axiosInstance.js
// Instancia axios global para módulos de negocio.
// Auth usa fetch nativo — no importar este archivo desde authService.js.

import axios from "axios";
import { Alert } from "../components/utils/alert.js";
import { logout } from "@/features/auth/services/logoutService";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Interceptor de request: adjuntar token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de response: manejar token expirado o inválido (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 403: el backend rechazó por falta de permisos (autorización real del servidor)
    if (error.response?.status === 403) {
      Alert.error(
        "Acción no permitida",
        error.response?.data?.error ?? "No tienes permisos para realizar esta acción."
      );
    }

    if (error.response?.status === 401) {
      logout();                        // Limpia sessionStorage["token"]
      window.location.href = "/auth"; // Redirige y recarga (limpia estado React)
    }
    return Promise.reject(error);
  }
);

export default api;