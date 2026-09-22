import { useState, useEffect, useCallback } from "react";
import quotationService from "@/shared/services/quotationService";

// `status` es el mismo query param del backend: active | inactive | all.
export function useQuotations(status = "active") {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quotationService.getAll({ status });
      setQuotations(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  return { quotations, loading, error, refetch: fetchQuotations };
}
