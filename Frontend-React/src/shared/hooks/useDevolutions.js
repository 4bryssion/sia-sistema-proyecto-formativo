import { useState, useEffect, useCallback } from "react";
import devolutionService from "@/shared/services/devolutionService";

// (p52) `activo` llego con el resto de los hooks compartidos en p51 y este se
// quedo sin ella: pide las devoluciones siempre, aunque la pantalla no las
// necesite o quien mira no pueda verlas.
export function useDevolutions(status = "active", activo = true) {
  const [devolutions, setDevolutions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const fetchAll = useCallback(async () => {
    if (!activo) {
      setDevolutions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDevolutions(await devolutionService.getAll(status, { silencioso: true }));
    } catch (err) {
      // Sin permiso de ver retornos el listado de préstamos debe seguir
      // funcionando: se deja la lista vacía en vez de romper la pantalla
      setError(err.response?.data?.error ?? "Error cargando devoluciones");
      setDevolutions([]);
    } finally {
      setLoading(false);
    }
  }, [status, activo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { devolutions, loading, error, refetch: fetchAll };
}
