import { useState, useEffect, useCallback } from "react";
import notificationService from "@/shared/services/notificationService";

// Mismo patrón que useUsers/useTasks: carga, error y refetch.
//
// (p50) Qué devuelve depende de quién pregunta, y eso lo decide el backend: un
// administrador recibe los últimos préstamos y devoluciones del sistema, y
// cualquier otra persona las tareas que le asignaron. Aquí no hay ninguna rama
// por rol a propósito: si la hubiera, bastaría llamar a la API a mano para ver
// lo que no toca.
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      setNotifications(await notificationService.getAll());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return { notifications, loading, error, refetch: fetchNotifications };
}
