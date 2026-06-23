import { useState, useEffect, useCallback } from "react";
import brandService from "../services/brandService";

export function useBrands() {
  const [brands, setBrands]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await brandService.getAll();
      setBrands(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar las marcas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  return { brands, loading, error, refetch: fetchBrands };
}
