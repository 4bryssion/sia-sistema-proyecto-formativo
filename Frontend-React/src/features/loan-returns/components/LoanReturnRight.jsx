import { useState, useEffect } from "react";
import { Input, Button } from "@/shared";
import { CornerDownLeft } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import { createLoanReturn } from "../services/loanReturnService";
import { useNavigate } from "react-router-dom";

export default function LoanReturnRight({ loanId }) {

  const navigate = useNavigate();

  // Estado del formulario con los campos requeridos por el backend
  const [form, setForm] = useState({
    remainingQuantity: "",  // Cantidad sobrante (solo consumibles)
    observations: "",       // Observaciones del retorno
  });

  // Estado para almacenar los datos del préstamo traídos del backend
  const [loan, setLoan] = useState(null);

  // Estado para manejar carga
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trae los datos del préstamo al montar el componente
  useEffect(() => {
    async function fetchLoan() {
      try {
        const response = await fetch(`http://localhost:5000/api/loans/${loanId}`);
        const data = await response.json();
        setLoan(data);
      } catch {
        console.error("Error al cargar los datos del préstamo.");
      }
    }

    if (loanId) fetchLoan();
  }, [loanId]);

  // Actualiza el campo correspondiente en el estado
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Envía el retorno al backend
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await createLoanReturn({
        loanId:            Number(loanId),
        materialId:        Number(loan.materialId),
        remainingQuantity: form.remainingQuantity ? Number(form.remainingQuantity) : null,
        observations:      form.observations,
      });

      console.log("Retorno registrado exitosamente.");
      alert("Retorno registrado exitosamente.");
      navigate(-1);

    } catch (err) {
      console.error("Error:", err.message);
      alert(err.message);

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">

      {/* Título */}
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Retorno de Préstamo
        </h2>
      </div>

      {/* Campos del formulario */}
      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-6 justify-items-center">

          {/* Cantidad sobrante - solo para materiales de consumo */}
          <Input
            label="Cantidad sobrante"
            name="remainingQuantity"
            placeholder="Ingrese la cantidad sobrante"
            type="number"
            value={form.remainingQuantity}
            onChange={handleChange}
          />

          {/* Observaciones del estado del material devuelto */}
          <Input
            label="Observaciones"
            name="observations"
            placeholder="Escriba las observaciones del retorno"
            value={form.observations}
            onChange={handleChange}
          />

        </div>
      </div>

      {/* Acciones */}
      <div className="grid gap-6 mt-6 sm:flex sm:justify-end lg:w-full">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </Button>

        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={handleSubmit}
          disabled={isSubmitting || !loan}
        >
          <CornerDownLeft size={16} />
          {isSubmitting ? "Registrando..." : "Registrar retorno"}
        </Button>
      </div>

      {/* Logo SENA */}
      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}