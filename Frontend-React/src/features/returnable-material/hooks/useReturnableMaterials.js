import { useState, useEffect, useCallback } from "react";
import returnableMaterialService from "../services/returnableMaterialService";

export function useReturnableMaterials(status = "active") {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await returnableMaterialService.getAll(status);
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
