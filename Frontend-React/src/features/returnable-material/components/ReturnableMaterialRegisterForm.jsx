import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, FileInput, TextArea, IconButton, Alert } from "@/shared";
import { Plus } from "lucide-react";
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema";
import returnableMaterialService from "../services/returnableMaterialService";
import categoryService from "../services/categoryService";
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
  // { value: "", label: "— Selecciona un estado —" },
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

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const fetchBrands = () =>
    brandService.getAll()
      .then((b) => setBrandOptions([
        // { value: "", label: "— Selecciona una marca —" },
        ...b.map((x) => ({ value: String(x.id), label: x.brandName })),
      ]))
      .catch(() => {});

  useEffect(() => {
    fetchBrands();

    categoryService.getAll()
      .then((c) => setCategoryOptions([
        // { value: "", label: "— Selecciona una categoría —" },
        ...c.map((x) => ({ value: String(x.id), label: x.categoryName })),
      ]))
      .catch(() => {});

    userService.getAll()
      .then((users) =>
        setUserOptions([
          // { value: "", label: "— Selecciona un cuentadante —" },
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
      // Con placa SENA la cantidad NO se envía (el "1" del input es solo visual;
      // el backend guarda null para identificar serializados)
      if (key === "quantity" && result.data.senaPlate) return;
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    fd.append("image", imageFiles[0]);
    fd.append("technical_sheet", sheetFiles[0]);

    try {
      Alert.loading("Creando material...");
      await returnableMaterialService.create(fd);
      Alert.close();
      Alert.success("Material creado");
      navigate("/dashboard/returnable-materials");
    } catch (err) {
      Alert.close();
      const msg = err.response?.data?.error ?? "Error al crear el material";
      Alert.error("Error al crear el material", msg);
      setErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex justify-center">
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8).
          md sin margen lateral: a 768px no caben 2 columnas de 320 + gap + p-8 + mx */}
      <div className="bg-white rounded-xl shadow-sm p-8 mx-6 w-full md:mx-0 md:w-fit">
      <form
        className="grid gap-6 md:grid-cols-2 1400:grid-cols-4 justify-items-center w-full md:max-w-max"
        onSubmit={handleSubmit}
      >
        {errors.form && (
          <p className="md:col-span-2 1400:col-span-4 text-error text-sm">{errors.form}</p>
        )}

        {/* Columna 1 — Archivos + ID */}
        <div className="flex flex-col gap-6 my-0 w-full md:w-[320px]">
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
            required
            options={categoryOptions}
            value={formData.categoryId}
            onChange={handleChange}
            error={errors.categoryId}
          />

          {/* 1400+: trigger de crear marca al final de la primera columna */}
          <BrandModalTrigger
            onClick={() => setIsBrandModalOpen(true)}
            className="hidden 1400:flex"
          />
        </div>

        {/* Columna 2 — Identificación */}
        <div className="flex flex-col gap-6 my-0 w-full md:w-[320px]">
          
          <Input
            label="Nombre del material"
            name="materialName"
            required
            placeholder="Ej: Taladro percutor inalámbrico"
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
            label="Modelo"
            name="model"
            required
            placeholder="Ej: GSB 18V-50"
            value={formData.model}
            onChange={handleChange}
            error={errors.model}
          />
          <Input
            label="Serial"
            name="serial"
            required
            placeholder="Ej: SN-2024-08841"
            value={formData.serial}
            onChange={handleChange}
            error={errors.serial}
          />
          <Input
            label="Placa SENA (opcional)"
            name="senaPlate"
            placeholder="Ej: 92451234 (solo materiales serializados)"
            value={formData.senaPlate}
            onChange={handleChange}
            error={errors.senaPlate}
          />
        </div>

        {/* Columna 3 — Datos físicos */}
        <div className="flex flex-col gap-6 my-0 w-full md:w-[320px]">
          
          <Input
            label="Dimensiones (opcional)"
            name="dimensions"
            placeholder="Ej: 30cm x 20cm x 10cm"
            value={formData.dimensions}
            onChange={handleChange}
            error={errors.dimensions}
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
          <Input
            label="Ubicación"
            name="location"
            required
            placeholder="Ej: Bodega 2 — Estante A3"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
          />
          <Select
            label="Estado"
            name="status"
            required
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={handleChange}
            error={errors.status}
          />
          {/* Wrapper relativo: la nota va absoluta bajo el input, montada sobre el
              gap de la columna, para no agregar altura ni romper el diseño */}
          <div className="relative w-full md:max-w-[320px] -mt-1">
            <Input
              label="Cantidad"
              name="quantity"
              type="number"
              placeholder="Ej: 5 (vacío si es serializado)"
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

          {/* md (768-1399): trigger de crear marca al final, abajo de Cantidad.
              mt-auto lo empuja al fondo de la columna para quedar al mismo nivel
              que el botón de crear de la columna vecina */}
          <BrandModalTrigger
            onClick={() => setIsBrandModalOpen(true)}
            className="hidden md:flex 1400:hidden md:mt-auto"
          />
        </div>

        {/* Columna 4 — Valores + descripción */}
        <div className="flex flex-col gap-6 my-0 w-full md:w-[320px]">
          <Input
            label="Valor unitario"
            name="unitPrice"
            required
            prefix="$"
            placeholder="Ej: 250000 (COP, sin puntos)"
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
          <Input
            label="Fecha de compra"
            name="purchaseDate"
            required
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
            error={errors.purchaseDate}
          />

          {/* Descripción: TextArea (ancho de input, alto fijo) */}
          <TextArea
            label="Descripción"
            name="description"
            required
            placeholder="Ej: Taladro percutor inalámbrico 18V con dos baterías, para formación en carpintería"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
          />

          {/* base (<640): trigger de crear marca entre la descripción y el botón de crear */}
          <BrandModalTrigger
            onClick={() => setIsBrandModalOpen(true)}
            className="flex sm:hidden"
          />

          {/* md-lg: mt-auto alinea el botón al fondo, al mismo nivel del trigger vecino */}
          <div className="flex items-center justify-center gap-6 md:mt-auto 1400:mt-0">
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
