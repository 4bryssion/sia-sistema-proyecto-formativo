import { Input, Button, Select } from "@/shared";
import { Pencil } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

export default function LoanViewRight() {
  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2
          className="
            font-main text-h2 text-center font-bold 
            1400:text-start 1400:justify-self-center 1400:w-[320px]
          "
        >
          Préstamo
        </h2>
      </div>

      {/* Inputs */}
      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-6 justify-items-center">
          <Select
            label="Material"
            name="loanMaterial"
            placeholder="Seleccione una opción"
          />

          <Input
            label="Cantidad"
            name="loanQuantity"
            placeholder="Ingrese la cantidad"
          />

          <Select
            label="Usuario solicitante"
            name="loanUser"
            placeholder="Seleccione una opción"
          />

          <Input
            label="Grupo de aprendices"
            name="loanGroup"
            placeholder="Ingrese el número del grupo"
          />

          <Input
            label="Fecha de salida"
            name="loanDateStart"
            placeholder="dd/mm/aaaa"
          />
        </div>

        <div className="grid gap-6 justify-items-center lg:h-max">
          <Input
            label="Fecha de entrega del material"
            name="loanDateEnd"
            placeholder="dd/mm/aaaa"
          />

          <Input
            label="Justificación de uso"
            name="loanJustification"
            placeholder="Escriba aquí la justificación"
          />
        </div>
      </div>

      {/* Acciones */}
      <div
        className="
          grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto sm:justify-between 
          lg:grid lg:grid-cols-2 lg:gap-6 lg:w-full
        "
      >
        <div className="lg:w-[320px] lg:justify-self-center">
          <Button variant="toggle" activeLabel="Activo" inactiveLabel="Desactivado" />
        </div>

        <Button variant="primary" className="gap-2 lg:justify-self-end lg:mr-24">
          <Pencil size={16} />
          Editar
        </Button>
      </div>

      {/* Logo SENA */}
      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}
