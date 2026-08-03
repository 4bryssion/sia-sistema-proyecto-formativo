import { useState, useEffect, useCallback } from "react";
import notificationService from "../services/notificationService";

// Mismo patrón que useUsers/useTasks: carga, error y refetch
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
