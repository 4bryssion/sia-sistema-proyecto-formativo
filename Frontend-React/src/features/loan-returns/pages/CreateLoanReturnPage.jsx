import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import loanService from "@/features/loans/services/loanService";
import LoanReturnLeft from "../components/LoanReturnLeft";
import LoanReturnRight from "../components/LoanReturnRight";

// Página para registrar el retorno de un préstamo
export default function CreateLoanReturnPage() {
  const { id } = useParams();
  const [loan, setLoan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchLoan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLoan(await loanService.getById(id));
    } catch (err) {
      setError(err.response?.data?.error ?? "Error cargando préstamo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLoan(); }, [fetchLoan]);

  if (loading) return <p className="p-6">Cargando préstamo...</p>;
  if (error)   return <p className="p-6 text-error">{error}</p>;
  if (!loan)   return null;

  // Guard de estado: mismo patrón que EditLoanPage — solo préstamos Activo pueden retornarse.
  if (loan.status !== "Activo")
    return (
      <p className="p-6 text-error">
        Solo los préstamos en estado Activo pueden retornarse. Estado actual: {loan.status}.
      </p>
    );

  return (
    <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full">
        <LoanReturnLeft loan={loan} />
      </div>
      <div className="bg-white p-4">
        <LoanReturnRight loan={loan} />
      </div>
    </div>
  );
}
