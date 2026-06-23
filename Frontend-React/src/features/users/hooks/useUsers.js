import { useState, useEffect, useCallback } from "react";
import userService from "../services/userService";

export function useUsers(status = "active") {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await userService.getAll(status));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}
