import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, FileInput, TextArea, IconButton, Alert } from "@/shared";
import { Plus } from "lucide-react";
import { consumableMaterialSchema } from "../schemas/consumableMaterialSchema";
import consumableMaterialService from "../services/consumableMaterialService";
import brandService from "@/features/brands/services/brandService";
import { CreateBrandModal } from "@/features/brands";
import userService from "@/features/users/services/userService";

// Trigger "Crear y asignar nueva marca": IconButton (+) con texto; abre CreateBrandModal.
// Las clases de display (flex/hidden por breakpoint) las aporta el consumidor vía className
function BrandModalTrigger({ onClick, className = "" }) {
  return (
    <div className={`items-center gap-2 ${className}`}>
      <IconButton ariaLabel="Crear y asignar nueva marca" onClick={onClick} hitSize={36} iconSize={20}>
        <Plus strokeWidth={2.5} />
      </IconButton>
      <button
        type="button"
        onClick={onClick}
        className="text-caption text-left cursor-pointer underline-offset-2 hover:underline"
      >
        Crear y asignar nueva marca
      </button>
    </div>
  );
}

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
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const fetchBrands = () =>
    brandService.getAll()
      .then((brands) =>
        setBrandOptions(
          brands.map((b) => ({ value: String(b.id), label: b.brandName }))
        )
      )
      .catch(() => {});

  useEffect(() => {
    fetchBrands();

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
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Valor total auto: cantidad × valor unitario; el usuario puede sobrescribirlo
      // manualmente (solo se recalcula cuando cambia cantidad o valor unitario)
      // Placa SENA ⇒ material único (serializado): cantidad se fija en 1 y se
      // bloquea; al borrar la placa se vacía y se habilita de nuevo.
      // OJO: el 1 es solo visual — al enviar, la cantidad de serializados sigue
      // yendo null para no romper la semántica de préstamos/retornos (quantity==null)
      if (name === "senaPlate") {
        next.quantity = value ? "1" : "";
      }
      if (name === "quantity" || name === "unitPrice" || name === "senaPlate") {
        const rawQ = next.quantity;
        // Cantidad vacía ⇒ material serializado (placa SENA) ⇒ cantidad efectiva 1
        const q = rawQ === "" ? 1 : Number(rawQ);
        const u = Number(name === "unitPrice" ? value : prev.unitPrice);
        if (q > 0 && u > 0) next.totalPrice = String(q * u);
      }
      return next;
    });
  };

  // Al crear una marca desde el modal se refresca el select y se autoselecciona
  const handleBrandCreated = async (createdBrand) => {
    await fetchBrands();
    if (createdBrand?.id) {
      setFormData((prev) => ({ ...prev, brandId: String(createdBrand.id) }));
    }
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
      // Con placa SENA la cantidad NO se envía (el "1" del input es solo visual;
      // el backend guarda null para identificar serializados)
      if (key === "quantity" && result.data.senaPlate) return;
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    fd.append("image", imageFile);

    try {
      Alert.loading("Creando material...");
      await consumableMaterialService.create(fd);
      Alert.close();
      Alert.success("Material creado");
      navigate("/dashboard/consumable-materials");
    } catch (err) {
      Alert.close();
      Alert.error("Error al crear el material", err.response?.data?.detalles?.join(" · ") ?? err.response?.data?.error ?? "");
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
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8) y se ajusta al contenido */}
      {/* md sin margen lateral: a 768px no caben 2 columnas de 320 + gap + p-8 + mx,
          y el grid comprimía las columnas comiéndose el gap */}
      <div className="bg-white rounded-xl shadow-sm p-8 mx-6 w-full md:mx-0 md:w-fit">
        <form
          className="grid gap-6 md:grid-cols-2 1400:grid-cols-4 justify-items-center w-full md:max-w-max"
          onSubmit={handleSubmit}
        >
          {errors.form && (
            <p className="md:col-span-2 1400:col-span-4 text-error text-sm">{errors.form}</p>
          )}

          {/* Columna 1 — Imagen */}
          <div className="flex flex-col gap-6 my-0 w-full md:w-[320px]">
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
              required
              value="Automático"
              readOnly
            />

            {/* 1400+: trigger de crear marca al final de la primera columna */}
            <BrandModalTrigger
              onClick={() => setIsBrandModalOpen(true)}
              className="hidden 1400:flex"
            />
          </div>

          {/* Columna 2 */}
          <div className="flex flex-col gap-6 my-0 w-full md:w-[320px]">
            <Input
              label="Nombre del material"
              name="materialName"
              placeholder="Ej: Tornillos autoperforantes 1/2''"
              value={formData.materialName}
              onChange={handleChange}
              error={errors.materialName}
            />

            <Select
              label="Marca"
              name="brandId"
              required
              options={brandOptions}
              value={formData.brandId}
              onChange={handleChange}
              error={errors.brandId}
            />

            <Input
              label="Placa SENA (opcional)"
              name="senaPlate"
              placeholder="Ej: 92451234 (solo materiales serializados)"
              value={formData.senaPlate}
              onChange={handleChange}
              error={errors.senaPlate}
            />

            <Input
              label="Ubicación"
              name="location"
              required
              placeholder="Ej: Bodega 2 — Estante A3"
              value={formData.location}
              onChange={handleChange}
              error={errors.location}
            />
          </div>

          {/* Columna 3 — Información económica */}
          <div className="flex flex-col gap-6 my-0 w-full md:w-[320px]">
            {/* Wrapper relativo: la nota va absoluta bajo el input, montada sobre el
                gap de la columna, para no agregar altura ni romper el diseño */}
            <div className="relative w-full md:max-w-[320px]">
              <Input
                label="Cantidad"
                name="quantity"
                placeholder="Ej: 25 (vacío si es serializado)"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={errors.quantity}
                disabled={!!formData.senaPlate}
              />
              {!formData.senaPlate && (
                <p className="absolute -bottom-5 left-0 text-caption text-gray-500">
                  Requerida cuando no hay Placa SENA
                </p>
              )}
            </div>

            <Select
              label="Estado"
              name="status"
              required
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={handleChange}
              error={errors.status}
            />

            <Input
              label="Valor unitario"
              name="unitPrice"
              required
              prefix="$"
              placeholder="Ej: 31000 (COP, sin puntos)"
              type="number"
              value={formData.unitPrice}
              onChange={handleChange}
              error={errors.unitPrice}
            />

            <Input
              label="Valor total"
              name="totalPrice"
              required
              prefix="$"
              placeholder="Se calcula: cantidad × valor unitario"
              type="number"
              value={formData.totalPrice}
              onChange={handleChange}
              error={errors.totalPrice}
            />

            {/* md (768-1399): trigger de crear marca debajo de Valor total */}
            <BrandModalTrigger
              onClick={() => setIsBrandModalOpen(true)}
              className="hidden md:flex 1400:hidden"
            />
          </div>

          {/* Columna 4 */}
          <div className="flex flex-col gap-6 my-0 w-full md:w-[320px]">
            <Input
              label="Fecha de compra"
              name="purchaseDate"
              required
              type="date"
              value={formData.purchaseDate}
              onChange={handleChange}
              error={errors.purchaseDate}
            />

            <Select
              label="Cuentadante" variant="search"
              name="userId"
              required
              options={userOptions}
              value={formData.userId}
              onChange={handleChange}
              error={errors.userId}
            />

            {/* Descripción: TextArea (ancho de input, alto fijo 152px) */}
            <TextArea
              label="Descripción"
              name="description"
              required
              placeholder="Ej: Caja de tornillos autoperforantes 1/2'' para uso en formación de estructuras metálicas"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
            />

            {/* base (<640): trigger de crear marca entre la descripción y el botón de crear */}
            <BrandModalTrigger
              onClick={() => setIsBrandModalOpen(true)}
              className="flex sm:hidden"
            />

            <div className="flex items-center justify-center gap-6">
              {/* sm (640-767): trigger al lado izquierdo del botón, separados por 24px (gap-6) */}
              <BrandModalTrigger
                onClick={() => setIsBrandModalOpen(true)}
                className="hidden sm:flex md:hidden"
              />
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? "Guardando..." : "Crear Material"}
              </Button>
            </div>
          </div>
        </form>

        <CreateBrandModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          onSave={handleBrandCreated}
        />
      </div>
    </div>
  );
}
