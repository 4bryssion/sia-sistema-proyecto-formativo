import { Input, Button, Select, IconButton, FileInput } from "@/shared";
import { Save, FileText } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

const IMG_BASE = "http://localhost:5000";

const STATUS_OPTIONS = [
  { value: "Disponible",    label: "Disponible" },
  { value: "No_disponible", label: "No disponible" },
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "En_prestamo",   label: "En préstamo" },
  { value: "Traslado",      label: "Traslado" },
  { value: "Baja",          label: "Baja" },
];

export default function ReturnableMaterialEditRight({
  form,
  onChange,
  brandOptions    = [],
  categoryOptions = [],
  userOptions     = [],
  errors          = {},
  onSubmit,
  saving,
  isActive,
  onToggle,
  toggling,
  technicalSheet,
  techSheetFile,
  onTechSheetChange,
}) {
  const openSheet = () => {
    if (technicalSheet) window.open(`${IMG_BASE}${technicalSheet}`, "_blank");
  };

  return (
    <div className="relative">
      {errors.form && <p className="text-error text-sm mb-4">{errors.form}</p>}

      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Material Retornable
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-2 justify-items-center">
          <Input label="Nombre del material" name="materialName" value={form.materialName} onChange={onChange} error={errors.materialName} />
          <Select label="Marca"      name="brandId"    options={brandOptions}    value={form.brandId}    onChange={onChange} error={errors.brandId} />
          <Select label="Categoría"  name="categoryId" options={categoryOptions} value={form.categoryId} onChange={onChange} error={errors.categoryId} />
          <Input label="Modelo"      name="model"      value={form.model}      onChange={onChange} error={errors.model} />
          <Input label="Serial"      name="serial"     value={form.serial}     onChange={onChange} error={errors.serial} />
          <Input label="Placa SENA (opcional)" name="senaPlate" value={form.senaPlate} onChange={onChange} error={errors.senaPlate} />
          <Input label="Cantidad" name="quantity" type="number" value={form.quantity} onChange={onChange} error={errors.quantity} />
          <Input label="Dimensiones (opcional)" name="dimensions" value={form.dimensions} onChange={onChange} error={errors.dimensions} />
        </div>

        <div className="grid gap-2 justify-items-center lg:h-max">
          <Select label="Estado"      name="status"  options={STATUS_OPTIONS} value={form.status}  onChange={onChange} error={errors.status} />
          <Select label="Cuentadante" name="userId"  options={userOptions}    value={form.userId}  onChange={onChange} error={errors.userId} />
          <Input label="Ubicación"    name="location"     value={form.location}     onChange={onChange} error={errors.location} />
          <Input label="Valor unitario" name="unitPrice"  type="number" value={form.unitPrice}  onChange={onChange} error={errors.unitPrice} />
          <Input label="Valor total"    name="totalPrice" type="number" value={form.totalPrice} onChange={onChange} error={errors.totalPrice} />
          <Input label="Fecha de compra" name="purchaseDate" type="date" value={form.purchaseDate} onChange={onChange} error={errors.purchaseDate} />
          <Input label="Descripción"  name="description" value={form.description} onChange={onChange} error={errors.description} />

          <div className="flex items-center justify-center gap-4 mt-4 w-full">
            <IconButton className="items-center shrink-0" ariaLabel="Ver ficha técnica" onClick={openSheet}>
              <FileText size={48} className="sm:w-20 sm:h-20" />
            </IconButton>
            <FileInput
              className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden shrink-0"
              accept="application/pdf,.pdf,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
              multiple={false}
              value={techSheetFile}
              onChange={onTechSheetChange}
            >
              Cargar
            </FileInput>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 gap-4 sm:pl-24 pr-20 sm:pr-24">
        <Button
          variant="toggle"
          activeLabel="Activo"
          inactiveLabel="Inactivo"
          checked={isActive}
          onClick={onToggle}
          disabled={toggling}
        />
        <Button
          variant="primary"
          className="gap-2 shrink-0"
          onClick={onSubmit}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-12 sm:w-16" />
    </div>
  );
}