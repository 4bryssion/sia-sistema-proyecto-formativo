import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, FileInput } from "@/shared";
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema";
import returnableMaterialService from "../services/returnableMaterialService";
import categoryService from "../services/categoryService";
import brandService from "@/features/brands/services/brandService";
import userService from "@/features/users/services/userService";

const STATUS_OPTIONS = [
  { value: "", label: "— Selecciona un estado —" },
  { value: "Disponible",    label: "Disponible" },
  { value: "No_disponible", label: "No disponible" },
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "En_prestamo",   label: "En préstamo" },
  { value: "Traslado",      label: "Traslado" },
  { value: "Baja",          label: "Baja" },
];

export default function ReturnableMaterialRegisterForm() {
  const navigate = useNavigate();

  const [brandOptions, setBrandOptions]       = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [userOptions, setUserOptions]         = useState([]);

  useEffect(() => {
    brandService.getAll()
      .then((b) => setBrandOptions([
        { value: "", label: "— Selecciona una marca —" },
        ...b.map((x) => ({ value: String(x.id), label: x.brandName })),
      ]))
      .catch(() => {});

    categoryService.getAll()
      .then((c) => setCategoryOptions([
        { value: "", label: "— Selecciona una categoría —" },
        ...c.map((x) => ({ value: String(x.id), label: x.categoryName })),
      ]))
      .catch(() => {});

    userService.getAll()
      .then((users) =>
        setUserOptions([
          { value: "", label: "— Selecciona un cuentadante —" },
          ...users
            .filter((u) => u.userAccountType === "Cuentadante")
            .map((u) => ({
              value: String(u.id),
              label: `${u.userFirstName} ${u.userLastName}`,
            })),
        ])
      )
      .catch(() => {});
  }, []);

  const [files, setFiles] = useState([]);

  const [formData, setFormData] = useState({
    materialName: "",
    brandId:      "",
    categoryId:   "",
    userId:       "",
    senaPlate:    "",
    quantity:     "",
    location:     "",
    status:       "",
    unitPrice:    "",
    totalPrice:   "",
    purchaseDate: "",
    description:  "",
    model:        "",
    serial:       "",
    dimensions:   "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = returnableMaterialSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const sheetFiles = files.filter((f) => !f.type.startsWith("image/"));

    if (!imageFiles.length) {
      setErrors({ files: "Se requiere una imagen del material" });
      return;
    }
    if (!sheetFiles.length) {
      setErrors({ files: "Se requiere la ficha técnica (PDF o Excel)" });
      return;
    }

    setErrors({});
    setSaving(true);

    const fd = new FormData();
    Object.entries(result.data).forEach(([key, val]) => {
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    fd.append("image", imageFiles[0]);
    fd.append("technical_sheet", sheetFiles[0]);

    try {
      await returnableMaterialService.create(fd);
      navigate("/dashboard/returnable-materials");
    } catch (err) {
      setErrors({ form: err.response?.data?.error ?? "Error al crear el material" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex justify-center">
      <form
        className="grid gap-6 mx-6 md:grid-cols-2 md:mx-12 1400:grid-cols-4 1400:mx-0 justify-items-center max-w-max"
        onSubmit={handleSubmit}
      >
        {errors.form && (
          <p className="md:col-span-2 1400:col-span-4 text-error text-sm">{errors.form}</p>
        )}

        {/* Columna 1 — Archivos + ID */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          <div className="flex ">
            <FileInput
              className="flex-1 h-[232px]"
              accept="image/jpeg,image/png,image/jpg,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              multiple={true}
              value={files}
              onChange={setFiles}
            >
              Cargar imagen y ficha técnica
            </FileInput>
          </div>
          {errors.files && <p className="text-error text-xs">{errors.files}</p>}

          <Input label="ID del material" value="Automático" readOnly />
          <Select
            label="Categoría"
            name="categoryId"
            options={categoryOptions}
            value={formData.categoryId}
            onChange={handleChange}
            error={errors.categoryId}
          />
        </div>

        {/* Columna 2 — Identificación */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          
          <Input
            label="Nombre del material"
            name="materialName"
            placeholder="Ingrese el nombre"
            value={formData.materialName}
            onChange={handleChange}
            error={errors.materialName}
          />
          <Select
            label="Marca"
            name="brandId"
            options={brandOptions}
            value={formData.brandId}
            onChange={handleChange}
            error={errors.brandId}
          />
          <Input
            label="Modelo"
            name="model"
            placeholder="Ingrese el modelo"
            value={formData.model}
            onChange={handleChange}
            error={errors.model}
          />
          <Input
            label="Serial"
            name="serial"
            placeholder="Ingrese el serial"
            value={formData.serial}
            onChange={handleChange}
            error={errors.serial}
          />
          <Input
            label="Placa SENA (opcional)"
            name="senaPlate"
            placeholder="Ingrese la placa SENA"
            value={formData.senaPlate}
            onChange={handleChange}
            error={errors.senaPlate}
          />
        </div>

        {/* Columna 3 — Datos físicos */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          
          <Input
            label="Dimensiones (opcional)"
            name="dimensions"
            placeholder="Ej: 30cm x 20cm x 10cm"
            value={formData.dimensions}
            onChange={handleChange}
            error={errors.dimensions}
          />
          <Select
            label="Cuentadante"
            name="userId"
            options={userOptions}
            value={formData.userId}
            onChange={handleChange}
            error={errors.userId}
          />
          <Input
            label="Ubicación"
            name="location"
            placeholder="Ingrese la ubicación"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
          />
          <Select
            label="Estado"
            name="status"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={handleChange}
            error={errors.status}
          />
          <Input
            className="-mt-1"
            label="Cantidad"
            name="quantity"
            type="number"
            placeholder="Cantidad de unidades"
            value={formData.quantity}
            onChange={handleChange}
            error={errors.quantity}
          />
          {!formData.senaPlate && (
            <p className="text-xs text-gray-500 -mt-4">
              Requerida cuando no hay Placa SENA
            </p>
          )}
        </div>

        {/* Columna 4 — Valores + descripción */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          <Input
            label="Valor unitario"
            name="unitPrice"
            placeholder="Ej: 250000"
            type="number"
            value={formData.unitPrice}
            onChange={handleChange}
            error={errors.unitPrice}
          />
          <Input
            label="Valor total"
            name="totalPrice"
            placeholder="Ej: 1250000"
            type="number"
            value={formData.totalPrice}
            onChange={handleChange}
            error={errors.totalPrice}
          />
          <Input
            label="Fecha de compra"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
            error={errors.purchaseDate}
          />
          <Input
            label="Descripción"
            name="description"
            placeholder="Descripción del material"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
          />
          <div className="flex items-center justify-center gap-6">
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? "Guardando..." : "Crear Material"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
