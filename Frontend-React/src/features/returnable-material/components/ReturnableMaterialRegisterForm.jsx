import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, FileInput, TextArea, IconButton, Alert, useColumnCount, useMediaQuery } from "@/shared";
import { Plus } from "lucide-react";
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema";
import returnableMaterialService from "../services/returnableMaterialService";
import categoryService from "../services/categoryService";
import brandService from "@/features/brands/services/brandService";
import { CreateBrandModal } from "@/features/brands";
import userService from "@/features/users/services/userService";
import {
  MAX_IMAGES,
  MAX_TECHNICAL_SHEETS,
  IMAGE_ACCEPT,
  TECHNICAL_SHEET_ACCEPT,
  requiresDimensions,
  categoryNameOf,
} from "../utils/materialFiles";

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
        className="font-secondary text-caption text-left cursor-pointer underline-offset-2 hover:underline"
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
// Distribución del formulario — COLUMNAS CONSTRUIDAS (misma técnica que
// materiales consumibles; ver el comentario largo de ConsumableMaterialRegisterForm
// para por qué se descartaron `grid-flow-col` y `columns-*`).
//
// Diferencia con consumibles: aquí el número de campos NO es fijo — dimensiones
// solo aparece con la categoría "Muebles y enseres". Por eso el reparto no puede
// ser una tabla de cortes escrita a mano: se calcula equilibrando la ALTURA de
// cada columna, contando la descripción (TextArea) como dos campos.
// ---------------------------------------------------------------------------

// Peso en "altos de input": el TextArea de descripción ocupa el de dos campos
const TEXTAREA_WEIGHT = 2;

function buildColumns(fields, columnCount) {
  const columns = [];
  let index = 0;

  for (let c = 0; c < columnCount; c += 1) {
    const columnasRestantes = columnCount - c;
    const altoPendiente = fields.slice(index).reduce((sum, f) => sum + f.weight, 0);
    // Altura a la que debería llegar esta columna para que las que faltan
    // terminen todas a la misma altura
    const objetivo = altoPendiente / columnasRestantes;

    const column = [];
    let alto = 0;
    while (
      index < fields.length &&
      // La última columna se lleva lo que quede; y ninguna se queda vacía
      (columnasRestantes === 1 || column.length === 0 || alto + fields[index].weight / 2 <= objetivo)
    ) {
      alto += fields[index].weight;
      column.push(fields[index]);
      index += 1;
    }
    columns.push(column);
  }

  return columns;
}

// Ancho de campo. El tope de 320px arranca en lg, igual que el reparto en
// columnas: hasta md hay una sola columna y deben aprovechar todo el ancho.
const FIELD_WIDTH = "w-full lg:w-[320px]";

// Dirección de las previsualizaciones de los dos file inputs:
// - hasta sm: debajo de la caja (los dos file inputs centrados)
// - desde sm: a la derecha, con la caja al comienzo de la fila
const PREVIEW_DIRECTION = "flex-col-reverse sm:flex-row-reverse lg:flex-col-reverse";

export default function ReturnableMaterialRegisterForm() {
  const navigate = useNavigate();

  const [brandOptions, setBrandOptions]       = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [userOptions, setUserOptions]         = useState([]);

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const fetchBrands = () =>
    brandService.getAll()
      .then((b) => setBrandOptions(b.map((x) => ({ value: String(x.id), label: x.brandName }))))
      .catch(() => {});

  useEffect(() => {
    fetchBrands();

    categoryService.getAll()
      .then((c) => setCategoryOptions(c.map((x) => ({ value: String(x.id), label: x.categoryName }))))
      .catch(() => {});

    // El SADMIN ya viene excluido por el backend (systemIdentities.js): aquí
    // solo se acota a cuentadantes
    userService.getAll()
      .then((users) =>
        setUserOptions(
          users
            .filter((u) => u.userAccountType === "Cuentadante")
            .map((u) => ({ value: String(u.id), label: `${u.userFirstName} ${u.userLastName}` })),
        ),
      )
      .catch(() => {});
  }, []);

  const [images, setImages] = useState([]);
  const [sheets, setSheets] = useState([]);

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

  // Solo "Muebles y enseres" pide dimensiones; para el resto el campo ni se
  // muestra y viaja vacío (el backend lo guarda como NULL)
  const categoryName = categoryNameOf(categoryOptions, formData.categoryId);
  const showDimensions = requiresDimensions(categoryName);

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
      // Al pasar a una categoría que no pide dimensiones se limpia lo escrito:
      // dejarlo guardaría una medida que el usuario ya no ve
      if (name === "categoryId" && !requiresDimensions(categoryNameOf(categoryOptions, value))) {
        next.dimensions = "";
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

    // Reglas que el schema no puede ver: los archivos viven fuera de formData y
    // la obligatoriedad de dimensiones depende del NOMBRE de la categoría
    const extraErrors = {};
    if (!images.length) extraErrors.image = "La imagen es requerida";
    if (!sheets.length) extraErrors.technicalSheet = "La ficha técnica es requerida (PDF o Excel)";
    if (showDimensions && !result.data.dimensions) {
      extraErrors.dimensions = "Las dimensiones son obligatorias para muebles y enseres";
    }
    if (Object.keys(extraErrors).length) {
      setErrors(extraErrors);
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
    images.forEach((file) => fd.append("image", file));
    // Repetir el mismo nombre de campo es la forma en que un FormData manda
    // varios archivos al mismo `fields({ name: 'technical_sheet' })` de multer
    sheets.forEach((file) => fd.append("technical_sheet", file));

    try {
      Alert.loading("Creando material...");
      await returnableMaterialService.create(fd);
      Alert.close();
      Alert.success("Material creado");
      navigate("/dashboard/returnable-materials");
    } catch (err) {
      Alert.close();
      const detalles = err.response?.data?.detalles;
      const mensaje = err.response?.data?.error ?? "Error al crear el material";
      Alert.error("Error al crear el material", detalles?.join(" · ") ?? mensaje);
      setErrors({ form: detalles?.length ? `${mensaje}: ${detalles.join(" | ")}` : mensaje });
    } finally {
      setSaving(false);
    }
  };

  // Cuántas previsualizaciones se ven a la vez.
  //
  // Solo en sm (640–767) caben todas en la fila: por debajo la tira se saldría
  // del ancho, y desde md el file input comparte el espacio con las columnas de
  // campos. En el resto se ve una y las flechas recorren las demás.
  const onlySm = useMediaQuery("(min-width: 40rem) and (max-width: 47.99rem)");
  const previewCount = onlySm ? undefined : 1;

  const columnCount = useColumnCount();
  const fields = [
    { key: "id", weight: 1, node: (
      <Input key="id" widthClass={FIELD_WIDTH}
        label="ID del material" required
        value="Automático" readOnly
        title="Se genera automáticamente al guardar" />
    ) },

    { key: "materialName", weight: 1, node: (
      <Input key="materialName" widthClass={FIELD_WIDTH}
        label="Nombre del material" name="materialName" required
        placeholder="Ej: Taladro percutor inalámbrico"
        value={formData.materialName} onChange={handleChange} error={errors.materialName} />
    ) },

    { key: "brandId", weight: 1, node: (
      <Select key="brandId" widthClass={FIELD_WIDTH} variant="search"
        label="Marca" name="brandId" required
        options={brandOptions}
        value={formData.brandId} onChange={handleChange} error={errors.brandId} />
    ) },

    { key: "categoryId", weight: 1, node: (
      <Select key="categoryId" widthClass={FIELD_WIDTH} variant="search"
        label="Categoría" name="categoryId" required
        options={categoryOptions}
        value={formData.categoryId} onChange={handleChange} error={errors.categoryId} />
    ) },

    { key: "model", weight: 1, node: (
      <Input key="model" widthClass={FIELD_WIDTH}
        label="Modelo" name="model" required
        placeholder="Ej: GSB 18V-50"
        value={formData.model} onChange={handleChange} error={errors.model} />
    ) },

    { key: "serial", weight: 1, node: (
      <Input key="serial" widthClass={FIELD_WIDTH}
        label="Serial" name="serial" required
        placeholder="Ej: SN-2024-08841"
        value={formData.serial} onChange={handleChange} error={errors.serial} />
    ) },

    { key: "senaPlate", weight: 1, node: (
      <Input key="senaPlate" widthClass={FIELD_WIDTH}
        label="Placa SENA (opcional)" name="senaPlate"
        placeholder="Ej: 92451234 (solo materiales serializados)"
        value={formData.senaPlate} onChange={handleChange} error={errors.senaPlate} />
    ) },

    // Dimensiones solo existe para "Muebles y enseres". No se oculta con CSS: se
    // saca del array, así el reparto en columnas se recalcula solo y no queda un
    // hueco donde estaba el campo
    ...(showDimensions ? [{ key: "dimensions", weight: 1, node: (
      <Input key="dimensions" widthClass={FIELD_WIDTH}
        label="Dimensiones" name="dimensions" required
        placeholder="Ej: 120cm x 60cm x 75cm"
        value={formData.dimensions} onChange={handleChange} error={errors.dimensions} />
    ) }] : []),

    { key: "userId", weight: 1, node: (
      <Select key="userId" widthClass={FIELD_WIDTH} variant="search"
        label="Cuentadante" name="userId" required
        options={userOptions}
        value={formData.userId} onChange={handleChange} error={errors.userId} />
    ) },

    { key: "location", weight: 1, node: (
      <Input key="location" widthClass={FIELD_WIDTH}
        label="Ubicación" name="location" required
        placeholder="Ej: Bodega 2 — Estante A3"
        value={formData.location} onChange={handleChange} error={errors.location} />
    ) },

    { key: "status", weight: 1, node: (
      <Select key="status" widthClass={FIELD_WIDTH}
        label="Estado" name="status" required
        options={STATUS_OPTIONS}
        value={formData.status} onChange={handleChange} error={errors.status} />
    ) },

    // Cantidad lleva una nota debajo. Va ABSOLUTA sobre el gap de la columna
    // (gap-6 = 24px): en flujo normal sumaba altura y separaba este campo del
    // siguiente más que al resto.
    { key: "quantity", weight: 1, node: (
      <div key="quantity" className={`${FIELD_WIDTH} relative`}>
        <Input widthClass="w-full"
          label="Cantidad" name="quantity" type="number"
          placeholder="Ej: 5 (vacío si es serializado)"
          value={formData.quantity} onChange={handleChange} error={errors.quantity}
          disabled={!!formData.senaPlate} />
        {!formData.senaPlate && !errors.quantity && (
          <p className="absolute -bottom-5 left-0 font-secondary text-caption text-text-muted">
            Requerida cuando no hay Placa SENA
          </p>
        )}
      </div>
    ) },

    { key: "unitPrice", weight: 1, node: (
      <Input key="unitPrice" widthClass={FIELD_WIDTH}
        label="Valor unitario" name="unitPrice" required prefix="$" type="number"
        placeholder="Ej: 250000 (COP, sin puntos)"
        value={formData.unitPrice} onChange={handleChange} error={errors.unitPrice} />
    ) },

    { key: "totalPrice", weight: 1, node: (
      <Input key="totalPrice" widthClass={FIELD_WIDTH}
        label="Valor total" name="totalPrice" required prefix="$" type="number"
        placeholder="Se calcula: cantidad × valor unitario"
        value={formData.totalPrice} onChange={handleChange} error={errors.totalPrice} />
    ) },

    { key: "purchaseDate", weight: 1, node: (
      <Input key="purchaseDate" widthClass={FIELD_WIDTH}
        label="Fecha de compra" name="purchaseDate" required type="date"
        value={formData.purchaseDate} onChange={handleChange} error={errors.purchaseDate} />
    ) },

    { key: "description", weight: TEXTAREA_WEIGHT, node: (
      <TextArea key="description" widthClass={FIELD_WIDTH}
        label="Descripción" name="description" required
        placeholder="Ej: Taladro percutor inalámbrico 18V con dos baterías, para formación en carpintería"
        value={formData.description} onChange={handleChange} error={errors.description} />
    ) },
  ];

  const columns = buildColumns(fields, columnCount);

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

          {/* Columna de archivos: hermana de las columnas de campos, NO parte de
              ellas. Así su altura (vacía o con previsualizaciones) es
              independiente y nunca desplaza a los campos.
              Los dos file inputs van SIEMPRE apilados en dos filas; lo que
              cambia por breakpoint es hacia dónde crece cada tira de
              previsualizaciones, y eso lo resuelve el propio FileInput. */}
          <div className="flex flex-col items-center gap-6 shrink-0 sm:items-start lg:items-center lg:w-45 1400:gap-8">
            <FileInput
              accept={IMAGE_ACCEPT}
              multiple={MAX_IMAGES > 1}
              maxFiles={MAX_IMAGES}
              label="Cargar imagen"
              required
              directionClassName={PREVIEW_DIRECTION}
              visibleCount={previewCount}
              value={images}
              onChange={setImages}
              error={errors.image}
            />

            <FileInput
              accept={TECHNICAL_SHEET_ACCEPT}
              multiple
              maxFiles={MAX_TECHNICAL_SHEETS}
              label="Cargar ficha técnica"
              required
              replaceLabel="Reemplazar ficha"
              directionClassName={PREVIEW_DIRECTION}
              visibleCount={previewCount}
              value={sheets}
              onChange={setSheets}
              error={errors.technicalSheet}
            />

            <p className="font-secondary text-caption text-text-muted text-center sm:text-left lg:text-center">
              Hasta {MAX_TECHNICAL_SHEETS} fichas técnicas en PDF o Excel
            </p>

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
                {column.map((field) => field.node)}
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
          <p className="font-secondary text-error text-caption mt-4 text-center">{errors.form}</p>
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
