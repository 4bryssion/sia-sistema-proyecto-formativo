import { useState, useEffect, useCallback } from "react";
import categoryService from "@/shared/services/categoryService";

// `status` es el mismo query param del backend: active | inactive | all.
// El listado lo controla con el select de la barra; por defecto muestra las
// activas, igual que sus módulos hermanos.
export function useCategories(status = "active") {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll({ status });
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}
