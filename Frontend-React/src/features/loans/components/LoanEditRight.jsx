import { Input, Button, Select } from "@/shared";
import { Pencil } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import LoanMaterialLines from "./LoanMaterialLines";

const STATUS_OPTIONS = [
  { value: "Activo",     label: "Activo" },
  { value: "Finalizado", label: "Finalizado" },
];

export default function LoanEditRight({
  form,
  onChange,
  userOptions,
  materialOptions,
  materials,
  onMaterialChange,
  onAddMaterial,
  onRemoveMaterial,
  materialErrors,
  errors,
  onSubmit,
  saving,
}) {
  return (
    <div className="relative">
      <h2 className="font-main text-h2 text-center font-bold mb-6 1400:text-start">Editar Préstamo</h2>

      <div className="grid lg:grid-cols-2 gap-4 w-full">
        <div className="grid gap-4 justify-items-center">
          <Select
            label="Prestador"
            name="lenderId"
            options={userOptions}
            value={form.lenderId}
            onChange={onChange}
            error={errors.lenderId}
          />
          <Select
            label="Receptor"
            name="receiverId"
            options={userOptions}
            value={form.receiverId}
            onChange={onChange}
            error={errors.receiverId}
          />
          <Input
            label="Grupo de aprendices"
            name="apprenticeGroup"
            type="number"
            value={form.apprenticeGroup}
            onChange={onChange}
            error={errors.apprenticeGroup}
          />
        </div>
        <div className="grid gap-4 justify-items-center">
          <Input
            label="Fecha de devolución"
            name="returnDate"
            type="date"
            value={form.returnDate}
            onChange={onChange}
            error={errors.returnDate}
          />
          <Input
            label="Justificación de uso"
            name="useJustification"
            value={form.useJustification}
            onChange={onChange}
            error={errors.useJustification}
          />
          <Select
            label="Estado"
            name="status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={onChange}
            error={errors.status}
          />
        </div>
      </div>

      <div className="mt-6 w-full max-w-170">
        <LoanMaterialLines
          lines={materials}
          options={materialOptions}
          onChange={onMaterialChange}
          onAdd={onAddMaterial}
          onRemove={onRemoveMaterial}
          errors={materialErrors}
          generalError={errors.materials}
        />
      </div>

      {errors.form && <p className="text-error font-secondary text-center mt-4">{errors.form}</p>}

      <div className="grid gap-6 mt-6 sm:flex sm:justify-end lg:w-full">
        <Button variant="primary" type="button" className="gap-2" onClick={onSubmit} disabled={saving}>
          <Pencil size={16} />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}
