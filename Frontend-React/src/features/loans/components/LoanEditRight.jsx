import { useState } from "react";
import { Input, Button, Select } from "@/shared";
import { Pencil } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

export default function LoanEditRight() {
  const [form, setForm] = useState({
    loanMaterial: "",
    loanQuantity: "",
    loanUser: "",
    loanGroup: "",
    loanDateStart: "",
    loanDateEnd: "",
    loanJustification: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Datos editados:", form);
  };

  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Editar Préstamo
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-6 justify-items-center">
          <Select
            label="Material"
            name="loanMaterial"
            placeholder="Seleccione una opción"
            value={form.loanMaterial}
            onChange={handleChange}
          />
          <Input
            label="Cantidad"
            name="loanQuantity"
            placeholder="Ingrese la cantidad"
            value={form.loanQuantity}
            onChange={handleChange}
          />
          <Select
            label="Usuario solicitante"
            name="loanUser"
            placeholder="Seleccione una opción"
            value={form.loanUser}
            onChange={handleChange}
          />
          <Input
            label="Grupo de aprendices"
            name="loanGroup"
            placeholder="Ingrese el número del grupo"
            value={form.loanGroup}
            onChange={handleChange}
          />
          <Input
            label="Fecha de salida"
            name="loanDateStart"
            placeholder="dd/mm/aaaa"
            value={form.loanDateStart}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-6 justify-items-center lg:h-max">
          <Input
            label="Fecha de entrega del material"
            name="loanDateEnd"
            placeholder="dd/mm/aaaa"
            value={form.loanDateEnd}
            onChange={handleChange}
          />
          <Input
            label="Justificación de uso"
            name="loanJustification"
            placeholder="Escriba aquí la justificación"
            value={form.loanJustification}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid gap-6 mt-6 sm:flex sm:justify-end lg:w-full">
        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={handleSubmit}
        >
          <Pencil size={16} />
          Guardar
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}