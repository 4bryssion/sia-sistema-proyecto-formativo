import { useState, useEffect, useCallback } from "react";
import groupService from "@/shared/services/groupService";

// `status` es el mismo query param del backend: active | inactive | all.
// El listado lo controla con el select de la barra; el panel de accesos y el
// select de grupo de crear usuario llaman al service sin params y por eso
// siguen recibiendo solo los activos.
export function useGroups(status = "active") {
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupService.getAll({ status });
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar los grupos");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  return { groups, loading, error, refetch: fetchGroups };
}
