import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, FileInput, TextArea, IconButton, Alert, useColumnCount } from "@/shared";
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

// ---------------------------------------------------------------------------
// Distribución del formulario — COLUMNAS CONSTRUIDAS, no retícula ni multi-columna.
//
// Se descartaron las dos alternativas de CSS por motivos concretos:
//
// - `grid-flow-col`: las FILAS SE COMPARTEN entre columnas. La descripción es un
//   TextArea de ~152px frente a los ~62px de un input, así que su fila se
//   estiraba en TODAS las columnas y abría un hueco muerto al lado (y en 1400
//   sacaba scroll).
// - `columns-*` (multi-columna): no tiene filas, pero el navegador reparte
//   BALANCEANDO POR ALTURA, no por cantidad, y con campos de alturas distintas
//   las columnas quedaban con 5, 4 y 3 campos — visiblemente disparejas.
//
// Se construyen las columnas: un array de campos cortado según SPLIT en tantas
// columnas como quepan (useColumnCount). Cada columna es un flex-col
// independiente, así que su altura no afecta a las demás. El orden de las
// preguntas se conserva: se llena una columna y se pasa a la siguiente.
//
// Sigue sin haber coordenadas escritas a mano: agregar o mover un campo es
// tocar el array, y el reparto se recalcula solo.
// ---------------------------------------------------------------------------

// Ancho de campo. El tope de 320px arranca en lg, igual que el reparto en
// columnas: hasta md hay una sola columna y deben aprovechar todo el ancho.
const FIELD_WIDTH = "w-full lg:w-[320px]";

// Cuántos de los 12 campos van en cada columna, según cuántas columnas quepan.
// Con 2 columnas el reparto NO es 6/6: la descripción es un TextArea que ocupa
// el alto de unos dos campos, así que la primera columna lleva uno más para que
// las dos terminen a la misma altura.
const SPLIT = {
  1: [12],
  2: [7, 5],
  3: [4, 4, 4],
};

// Previsualización de la imagen: a la izquierda en sm, hacia abajo en el resto.
const PREVIEW_DIRECTION = "flex-col-reverse sm:flex-row md:flex-col-reverse";

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

  // Los campos como array; SPLIT decide cuántos van en cada columna según
  // cuántas quepan. Cada campo lleva su `key` porque acaba dentro de un map.
  const columnCount = useColumnCount();
  const fields = [
    <Input key="id" widthClass={FIELD_WIDTH}
      label="ID del material" name="materialNameAuto" required
      value="Automático" readOnly
      title="Se genera automáticamente al guardar" />,

    <Input key="materialName" widthClass={FIELD_WIDTH}
      label="Nombre del material" name="materialName" required
      placeholder="Ej: Tornillos autoperforantes 1/2''"
      value={formData.materialName} onChange={handleChange} error={errors.materialName} />,

    <Select key="brandId" widthClass={FIELD_WIDTH} variant="search"
      label="Marca" name="brandId" required
      options={brandOptions}
      value={formData.brandId} onChange={handleChange} error={errors.brandId} />,

    <Input key="senaPlate" widthClass={FIELD_WIDTH}
      label="Placa SENA (opcional)" name="senaPlate"
      placeholder="Ej: 92451234 (solo materiales serializados)"
      value={formData.senaPlate} onChange={handleChange} error={errors.senaPlate} />,

    <Input key="location" widthClass={FIELD_WIDTH}
      label="Ubicación" name="location" required
      placeholder="Ej: Bodega 2 — Estante A3"
      value={formData.location} onChange={handleChange} error={errors.location} />,

    // Cantidad lleva una nota debajo. Va ABSOLUTA sobre el gap de la columna
    // (gap-6 = 24px): en flujo normal sumaba altura y separaba este campo del
    // siguiente más que al resto.
    <div key="quantity" className={`${FIELD_WIDTH} relative`}>
      <Input widthClass="w-full"
        label="Cantidad" name="quantity" type="number"
        placeholder="Ej: 25 (vacío si es serializado)"
        value={formData.quantity} onChange={handleChange} error={errors.quantity}
        disabled={!!formData.senaPlate} />
      {!formData.senaPlate && !errors.quantity && (
        <p className="absolute -bottom-5 left-0 font-secondary text-caption text-text-muted">
          Requerida cuando no hay Placa SENA
        </p>
      )}
    </div>,

    <Select key="status" widthClass={FIELD_WIDTH}
      label="Estado" name="status" required
      options={STATUS_OPTIONS}
      value={formData.status} onChange={handleChange} error={errors.status} />,

    <Input key="unitPrice" widthClass={FIELD_WIDTH}
      label="Valor unitario" name="unitPrice" required prefix="$" type="number"
      placeholder="Ej: 31000 (COP, sin puntos)"
      value={formData.unitPrice} onChange={handleChange} error={errors.unitPrice} />,

    <Input key="totalPrice" widthClass={FIELD_WIDTH}
      label="Valor total" name="totalPrice" required prefix="$" type="number"
      placeholder="Se calcula: cantidad × valor unitario"
      value={formData.totalPrice} onChange={handleChange} error={errors.totalPrice} />,

    <Input key="purchaseDate" widthClass={FIELD_WIDTH}
      label="Fecha de compra" name="purchaseDate" required type="date"
      value={formData.purchaseDate} onChange={handleChange} error={errors.purchaseDate} />,

    <Select key="userId" widthClass={FIELD_WIDTH} variant="search"
      label="Cuentadante" name="userId" required
      options={userOptions}
      value={formData.userId} onChange={handleChange} error={errors.userId} />,

    <TextArea key="description" widthClass={FIELD_WIDTH}
      label="Descripción" name="description" required
      placeholder="Ej: Caja de tornillos autoperforantes para formación en estructuras metálicas"
      value={formData.description} onChange={handleChange} error={errors.description} />,
  ];

  // Corte según SPLIT, conservando el orden de las preguntas
  let cut = 0;
  const columns = SPLIT[columnCount].map((size) => fields.slice(cut, (cut += size)));

  return (
    <div className="flex justify-center pt-4">
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8).
          w-fit desde lg y no antes: `w-fit` ajusta la tarjeta al contenido, y con
          una sola columna eso dejaría a los campos sin ancho al que crecer. */}
      <div className="bg-white rounded-xl shadow-sm p-8 mx-6 w-full md:mx-12 lg:w-fit 1400:mx-0">
        <form
          className="flex flex-col items-center gap-8 lg:flex-row lg:items-start"
          onSubmit={handleSubmit}
        >

          {/* Columna de la imagen: hermana de las columnas de campos, NO parte de
              ellas. Así su altura (vacía o con previsualización) es independiente
              y nunca desplaza a los campos. Desde lg lleva dentro el trigger. */}
          <div className="flex flex-col items-center gap-6 shrink-0 lg:w-45 1400:gap-8">
            <FileInput
              accept="image/*"
              multiple={false}
              label="Cargar imagen"
              required
              directionClassName={PREVIEW_DIRECTION}
              value={imageFile ? [imageFile] : []}
              onChange={(files) => setImageFile(files[0] ?? null)}
              error={errors.image}
            />

            <BrandModalTrigger
              onClick={() => setIsBrandModalOpen(true)}
              className="hidden lg:flex"
            />
          </div>

          {/* Columnas de campos: cada una es un flex-col independiente, así el
              alto de un campo solo afecta a su columna */}
          <div className="flex flex-col gap-6 w-full lg:flex-row lg:w-auto lg:items-start lg:gap-5">
            {columns.map((column, i) => (
              <div key={i} className="flex flex-col gap-6 w-full lg:w-auto">
                {column}
              </div>
            ))}
          </div>
        </form>

        {/* Trigger (hasta md) y botón, fuera de las columnas para que su posición
            no dependa del reparto.
            El trigger sigue la alineación pedida por breakpoint; el botón va
            SIEMPRE centrado. */}
        <div className="mt-8 flex flex-col items-center gap-6 sm:items-start md:items-center lg:hidden">
          <BrandModalTrigger onClick={() => setIsBrandModalOpen(true)} className="flex" />
        </div>

        <div className="mt-6 flex justify-center">
          <Button type="submit" variant="primary" size="sm" disabled={saving} onClick={handleSubmit}>
            {saving ? "Guardando..." : "Crear Material"}
          </Button>
        </div>

        {errors.form && (
          <p className="text-error text-caption mt-4 text-center">{errors.form}</p>
        )}

        <CreateBrandModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          onSave={handleBrandCreated}
        />
      </div>
    </div>
  );
}
