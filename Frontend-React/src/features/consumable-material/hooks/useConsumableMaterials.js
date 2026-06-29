import { useState, useEffect, useCallback } from "react";
import consumableMaterialService from "../services/consumableMaterialService";

export function useConsumableMaterials(status = "active") {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consumableMaterialService.getAll(status);
      setMaterials(data);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error cargando materiales");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { materials, loading, error, refetch: fetchAll };
}
