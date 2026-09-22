import { useState, useEffect, useCallback } from "react";
import taskService from "@/shared/services/taskService";

// userId opcional: si viene, trae solo las tareas de ese usuario (GET /tasks/user/:id).
// (p50) `status` es el estado del registro —"active" | "inactive" | "all"— y solo
// aplica al listado completo: quien ve únicamente las suyas las ve todas activas.
export function useTasks(userId, status = "active") {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(userId ? await taskService.getByUser(userId) : await taskService.getAll(status));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, [userId, status]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}
