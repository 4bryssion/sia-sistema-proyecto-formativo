import { useState, useEffect, useCallback } from "react";
import brandService from "@/shared/services/brandService";

// `status` es el mismo query param del backend: active | inactive | all.
// El listado lo controla con el select de la barra; por defecto muestra las
// activas, igual que los módulos principales.
export function useBrands(status = "active") {
  const [brands, setBrands]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await brandService.getAll({ status });
      setBrands(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar las marcas");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  return { brands, loading, error, refetch: fetchBrands };
}
