import { useState } from "react";
import { Input, Button } from "@/shared";
import { CornerDownLeft } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import { useNavigate } from "react-router-dom";

export default function LoanReturnRight() {

  const navigate = useNavigate();

  // Estado del formulario con los campos requeridos
  const [form, setForm] = useState({
    remainingQuantity: "",  // Cantidad sobrante (solo consumibles)
    observations: "",       // Observaciones del retorno
  });

  // Actualiza el campo correspondiente en el estado
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Maneja el envío del formulario
  // Por ahora imprime los datos en consola; aquí irá la llamada a la API
  const handleSubmit = () => {
    console.log("Datos retorno:", form);
  };

  return (
    <div className="relative">

      {/* Título */}
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Retorno de Préstamo
        </h2>
      </div>

      {/* gap reducido de gap-6 a gap-3 para inputs más juntos */}
      <div className="grid lg:grid-cols-2 gap-3 w-full">
        <div className="grid gap-3 justify-items-center">

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

      {/* Acciones + Logo: en un mismo contenedor flex con wrap para que
          nunca se superpongan, sin importar el ancho de pantalla */}
      <div className="flex flex-wrap items-center justify-end gap-6 mt-6">
        <div className="flex flex-wrap justify-end gap-3 flex-1 min-w-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            className="gap-2"
            onClick={handleSubmit}
          >
            <CornerDownLeft size={16} />
            Registrar retorno
          </Button>
        </div>

        {/* Logo SENA: ahora en el flujo normal, nunca se monta encima */}
        <img src={logo} alt="Logo SENA" className="w-16 shrink-0" />
      </div>
    </div>
  );
}