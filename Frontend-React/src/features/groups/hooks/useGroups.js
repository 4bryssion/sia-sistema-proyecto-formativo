import { useState, useEffect, useCallback } from "react";
import groupService from "../services/groupService";

export function useGroups() {
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupService.getAll();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar los grupos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  return { groups, loading, error, refetch: fetchGroups };
}
