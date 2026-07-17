import { Input, Button, Select } from "@/shared";
import { Save } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

const STATUS_OPTIONS = [
  { value: "Disponible",    label: "Disponible" },
  { value: "No_disponible", label: "No disponible" },
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "En_prestamo",   label: "En préstamo" },
  { value: "Traslado",      label: "Traslado" },
  { value: "Baja",          label: "Baja" },
];

export default function ConsumableMaterialEditRight({
  form,
  onChange,
  brandOptions = [],
  userOptions  = [],
  errors       = {},
  onSubmit,
  saving,
  isActive,
  onToggle,
  toggling,
}) {
  return (
    <div className="relative">
      {errors.form && (
        <p className="text-error text-sm mb-4">{errors.form}</p>
      )}

      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Material Consumible
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-2 justify-items-center">
          <Input
            label="Nombre del material"
            name="materialName"
            value={form.materialName}
            onChange={onChange}
            error={errors.materialName}
          />
          <Select
            label="Marca"
            name="brandId"
            options={brandOptions}
            value={form.brandId}
            onChange={onChange}
            error={errors.brandId}
          />
          <Select
            label="Estado"
            name="status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={onChange}
            error={errors.status}
          />
          <Select
            label="Cuentadante"
            name="userId"
            options={userOptions}
            value={form.userId}
            onChange={onChange}
            error={errors.userId}
          />
          <Input
            label="Ubicación"
            name="location"
            value={form.location}
            onChange={onChange}
            error={errors.location}
          />
          <Input
            label="Fecha de compra"
            name="purchaseDate"
            type="date"
            value={form.purchaseDate}
            onChange={onChange}
            error={errors.purchaseDate}
          />
        </div>

        <div className="grid gap-2 justify-items-center lg:h-max">
          <Input
            label="Placa SENA (opcional)"
            name="senaPlate"
            value={form.senaPlate}
            onChange={onChange}
            error={errors.senaPlate}
          />
          <Input
            label="Cantidad"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={onChange}
            error={errors.quantity}
          />
          <Input
            label="Valor unitario"
            name="unitPrice"
            type="number"
            value={form.unitPrice}
            onChange={onChange}
            error={errors.unitPrice}
          />
          <Input
            label="Valor total"
            name="totalPrice"
            type="number"
            value={form.totalPrice}
            onChange={onChange}
            error={errors.totalPrice}
          />
          <Input
            label="Descripción"
            name="description"
            value={form.description}
            onChange={onChange}
            error={errors.description}
          />
        </div>
      </div>

      <div className="grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto sm:justify-between lg:grid lg:grid-cols-2 lg:gap-6 lg:w-full">
        <div className="lg:w-[320px] lg:justify-self-center">
          <Button
            variant="toggle"
            activeLabel="Activo"
            inactiveLabel="Inactivo"
            checked={isActive}
            onClick={onToggle}
            disabled={toggling}
          />
        </div>
        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={onSubmit}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 -bottom-3 w-16" />
    </div>
  );
}
