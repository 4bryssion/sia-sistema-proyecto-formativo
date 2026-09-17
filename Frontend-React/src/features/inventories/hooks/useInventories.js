import { useState, useEffect, useCallback } from "react";
import inventoryService from "@/shared/services/inventoryService";

// `status` es el mismo query param del backend: active | inactive | all.
// El listado lo controla con el select de la barra; por defecto muestra los
// activos, igual que los módulos principales.
export function useInventories(status = "active") {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const fetchInventories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAll({ status });
      setInventories(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar los inventarios");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchInventories(); }, [fetchInventories]);

  return { inventories, loading, error, refetch: fetchInventories };
}
