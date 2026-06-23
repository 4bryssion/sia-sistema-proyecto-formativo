import { useState, useEffect, useCallback } from "react";
import taskService from "../services/taskService";

export function useTasks() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await taskService.getAll());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}
