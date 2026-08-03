import { useState, useEffect, useCallback } from "react";
import taskService from "../services/taskService";

// userId opcional: si viene, trae solo las tareas de ese usuario (GET /tasks/user/:id)
export function useTasks(userId) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(userId ? await taskService.getByUser(userId) : await taskService.getAll());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}
