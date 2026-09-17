import { useState, useEffect, useCallback } from "react";
import devolutionService from "@/shared/services/devolutionService";

export function useDevolutions(status = "active") {
  const [devolutions, setDevolutions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDevolutions(await devolutionService.getAll(status));
    } catch (err) {
      // Sin permiso de ver retornos el listado de préstamos debe seguir
      // funcionando: se deja la lista vacía en vez de romper la pantalla
      setError(err.response?.data?.error ?? "Error cargando devoluciones");
      setDevolutions([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { devolutions, loading, error, refetch: fetchAll };
}
