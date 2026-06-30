import { useState, useEffect, useCallback } from "react";
import loanService from "../services/loanService";

export function useLoans(status = "active") {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loanService.getAll(status);
      setLoans(data);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error cargando préstamos");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { loans, loading, error, refetch: fetchAll };
}
