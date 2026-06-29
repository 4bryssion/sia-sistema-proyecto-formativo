import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, FileInput } from "@/shared";
import { consumableMaterialSchema } from "../schemas/consumableMaterialSchema";
import consumableMaterialService from "../services/consumableMaterialService";
import brandService from "@/features/brands/services/brandService";
import userService from "@/features/users/services/userService";

const STATUS_OPTIONS = [
  { value: "Disponible",    label: "Disponible" },
  { value: "No_disponible", label: "No disponible" },
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "En_prestamo",   label: "En préstamo" },
  { value: "Traslado",      label: "Traslado" },
  { value: "Baja",          label: "Baja" },
];

export default function ConsumableMaterialRegisterForm() {
  const navigate = useNavigate();

  const [brandOptions, setBrandOptions] = useState([]);
  const [userOptions, setUserOptions]   = useState([]);

  useEffect(() => {
    brandService.getAll()
      .then((brands) =>
        setBrandOptions(
          brands.map((b) => ({ value: String(b.id), label: b.brandName }))
        )
      )
      .catch(() => {});

    userService.getAll()
      .then((users) => {
        const cuentadantes = users.filter((u) => u.userAccountType === "Cuentadante");
        setUserOptions(
          cuentadantes.map((u) => ({
            value: String(u.id),
            label: `${u.userFirstName} ${u.userLastName}`,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    materialName:  "",
    brandId:       "",
    senaPlate:     "",
    location:      "",
    quantity:      "",
    status:        "",
    unitPrice:     "",
    totalPrice:    "",
    purchaseDate:  "",
    userId:        "",
    description:   "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = consumableMaterialSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!imageFile) {
      setErrors({ image: "La imagen es requerida" });
      return;
    }

    setErrors({});
    setSaving(true);

    const fd = new FormData();
    Object.entries(result.data).forEach(([key, val]) => {
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    fd.append("image", imageFile);

    try {
      await consumableMaterialService.create(fd);
      navigate("/dashboard/consumable-materials");
    } catch (err) {
      const mensaje = err.response?.data?.error ?? "Error al crear el material";
      const detalles = err.response?.data?.detalles;
      setErrors({
        form: detalles?.length
          ? `${mensaje}: ${detalles.join(" | ")}`
          : mensaje,
      });
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

        {/* Columna 1 — Imagen */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          <div className="flex-1 flex">
            <FileInput
              className="flex-1"
              accept="image/*"
              multiple={false}
              value={imageFile ? [imageFile] : []}
              onChange={(files) => setImageFile(files[0] ?? null)}
            >
              Cargar imagen
            </FileInput>
          </div>
          {errors.image && <p className="text-error text-xs">{errors.image}</p>}

          <Input
            label="ID del material"
            name="materialName"
            value="Automático"
            readOnly
          />
        </div>

        {/* Columna 2 */}
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
            label="Placa SENA (opcional)"
            name="senaPlate"
            placeholder="Ingrese la placa SENA"
            value={formData.senaPlate}
            onChange={handleChange}
            error={errors.senaPlate}
          />

          <Input
            label="Ubicación"
            name="location"
            placeholder="Ingrese la ubicación"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
          />
        </div>

        {/* Columna 3 — Información económica */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          <Input
            label="Cantidad"
            name="quantity"
            placeholder="Ingrese la cantidad"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            error={errors.quantity}
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
            label="Valor unitario"
            name="unitPrice"
            placeholder="Ej: 31000"
            type="number"
            value={formData.unitPrice}
            onChange={handleChange}
            error={errors.unitPrice}
          />

          <Input
            label="Valor total"
            name="totalPrice"
            placeholder="Ej: 4340000"
            type="number"
            value={formData.totalPrice}
            onChange={handleChange}
            error={errors.totalPrice}
          />
        </div>

        {/* Columna 4 */}
        <div className="flex flex-col gap-6 my-0 w-[320px]">
          <Input
            label="Fecha de compra"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
            error={errors.purchaseDate}
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
