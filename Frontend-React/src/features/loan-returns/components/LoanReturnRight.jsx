import { useState, useEffect } from "react";
import { Input, Button } from "@/shared";
import { CornerDownLeft } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import { createLoanReturn } from "../services/loanReturnService";

export default function LoanReturnRight({ loanId }) {

  // Estado del formulario con los campos requeridos por el backend
  const [form, setForm] = useState({
    remainingQuantity: "",  // Cantidad sobrante (solo consumibles)
    observations: "",       // Observaciones del retorno
  });

  // Estado para almacenar los datos del préstamo traídos del backend
  const [loan, setLoan] = useState(null);

  // Estado para manejar errores y carga
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Trae los datos del préstamo al montar el componente
  useEffect(() => {
    async function fetchLoan() {
      try {
        const response = await fetch(`http://localhost:5000/api/loans/${loanId}`);
        const data = await response.json();
        setLoan(data);
      } catch {
        setError("Error al cargar los datos del préstamo.");
      }
    }

    if (loanId) fetchLoan();
  }, [loanId]);

  // Actualiza el campo correspondiente en el estado
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Envía el retorno al backend
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await createLoanReturn({
        loanId: Number(loanId),
        materialId: Number(loan.materialId),
        remainingQuantity: form.remainingQuantity ? Number(form.remainingQuantity) : null,
        observations: form.observations,
      });

      alert("Retorno registrado exitosamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Retorno de Préstamo
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-6 justify-items-center">

          {/* Cantidad sobrante del material */}
          <Input
            label="Cantidad sobrante"
            name="remainingQuantity"
            placeholder="Ingrese la cantidad sobrante"
            value={form.remainingQuantity}
            onChange={handleChange}
          />

          {/* Observaciones del retorno */}
          <Input
            label="Observaciones"
            name="observations"
            placeholder="Escriba las observaciones del retorno"
            value={form.observations}
            onChange={handleChange}
          />

        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <p className="text-red-500 mt-4">{error}</p>
      )}

      {/* Botón registrar retorno */}
      <div className="grid gap-6 mt-6 sm:flex sm:justify-end lg:w-full">
        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={handleSubmit}
          disabled={loading || !loan}
        >
          <CornerDownLeft size={16} />
          {loading ? "Registrando..." : "Registrar retorno"}
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}