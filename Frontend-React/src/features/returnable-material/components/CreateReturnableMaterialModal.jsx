import { useState, useEffect } from "react";
import { Input, Select, TextArea, Alert, MultiStepModal, CreateAndAssignTrigger } from "@/shared";
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema";
import returnableMaterialService from "@/shared/services/returnableMaterialService";
import categoryService from "@/shared/services/categoryService";
import CreateBrandModal from "@/shared/components/brands/CreateBrandModal";
import CreateInventoryModal from "@/shared/components/inventories/CreateInventoryModal";
import CreateCategoryModal from "@/shared/components/categories/CreateCategoryModal";
import MaterialFilesBand from "@/shared/components/materials/MaterialFilesBand";
import { useMaterialCatalogs } from "@/shared/hooks/useMaterialCatalogs";
import { STATUS_FILTER_OPTIONS } from "@/shared/utils/materialStatusLabel";
import { aplicarCambioDeMaterial } from "@/shared/utils/materialForm";
import { requiresDimensions, toCategoryOptions } from "../utils/categoryRules";
import { Eye } from "lucide-react";
import quotationService from "@/shared/services/quotationService";
import UploadQuotationsModal from "@/shared/components/quotations/UploadQuotationsModal";
import {
  MAX_POR_MATERIAL, MAX_POR_CARGA_EN_MATERIAL,
  toQuotationOptions, quotationUrl,
} from "@/shared/utils/quotationFiles";

// (p49) Crear material devolutivo pasó de página a modal de 6 pasos.
//
// Lo que se fue con la página: los campos eran un ARRAY con un "peso" por campo
// (el TextArea contaba como dos) que una función repartía en columnas
// equilibrando la altura, según cuántas cupieran. Con los campos en pasos no hay
// nada que equilibrar: cada paso tiene los suyos y ninguna fila mezcla un campo
// alto con campos bajos.
//
// También se fue la columna lateral de archivos propia, distinta de la del modal
// de editar. Ahora los dos usan MaterialFilesBand.

// Qué campos pertenecen a cada paso, para enseñar solo los errores del paso que
// el usuario tiene delante. Son los cinco pasos del material de consumo más uno
// propio: lo que distingue al devolutivo (categoría, modelo, serial y
// dimensiones) va junto en su propio paso, no repartido entre los demás.
//
// `image` y `technicalSheet` no los valida el schema —los archivos viven fuera
// de formData— pero se listan igual porque es en el último paso donde aparecen.
const CAMPOS_POR_PASO = [
  ["materialName", "description"],
  ["categoryId", "model", "serial", "dimensions"],
  ["brandId", "inventoryId", "location", "status", "senaPlate"],
  ["quantity", "unitPrice", "totalPrice", "purchaseDate", "entryDate", "quotationIds"],
  ["accountableIds"],
  ["image", "technicalSheet"],
];

export default function CreateReturnableMaterialModal({ isOpen, onClose, onSaved }) {
  // El cuerpo solo se monta con el modal abierto: cada apertura arranca en el
  // paso 1 y en blanco, sin un useEffect que haga setState.
  if (!isOpen) return null;

  return <CreateReturnableBody onClose={onClose} onSaved={onSaved} />;
}

function CreateReturnableBody({ onClose, onSaved }) {
  const {
    brandOptions, inventoryOptions, accountableOptions,
    refetchBrands, refetchInventories,
  } = useMaterialCatalogs();

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // (p50) Cotizaciones disponibles: solo las habilitadas, porque ofrecer una
  // deshabilitada sería ofrecer algo que el backend rechaza al guardar.
  const [quotationOptions, setQuotationOptions] = useState([]);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  const cargarCotizaciones = () =>
    quotationService.getAll()
      .then((lista) => setQuotationOptions(toQuotationOptions(lista)))
      .catch(() => setQuotationOptions([]));

  useEffect(() => { cargarCotizaciones(); }, []);

  // Las categorías son un catálogo fijo y solo existen aquí, así que no entran
  // en useMaterialCatalogs (que es compartido con el material de consumo).
  useEffect(() => {
    categoryService.getAll()
      .then((c) => setCategoryOptions(toCategoryOptions(c)))
      .catch(() => {});
  }, []);

  const [images, setImages] = useState([]);
  const [sheets, setSheets] = useState([]);

  const [formData, setFormData] = useState({
    materialName:   "",
    brandId:        "",
    inventoryId:    "",
    accountableIds: [],
    categoryId:     "",
    senaPlate:      "",
    quantity:       "",
    location:       "",
    status:         "",
    unitPrice:      "",
    totalPrice:     "",
    purchaseDate:   "",
    entryDate:      "",
    description:    "",
    model:          "",
    serial:         "",
    dimensions:     "",
    // (p50) Entre 1 y 3, obligatorias: son el respaldo del precio del material
    quotationIds:   [],
  });

  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Solo "Muebles y enseres" pide dimensiones; para el resto el campo ni se
  // muestra y viaja vacío (el backend lo guarda como NULL)
  const showDimensions = requiresDimensions(categoryOptions, formData.categoryId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = aplicarCambioDeMaterial(prev, name, value);
      // Al pasar a una categoría que no pide dimensiones se limpia lo escrito:
      // dejarlo guardaría una medida que el usuario ya no ve. Es propio del
      // devolutivo, así que no vive en la regla compartida.
      if (name === "categoryId" && !requiresDimensions(categoryOptions, value)) {
        next.dimensions = "";
      }
      return next;
    });
  };

  const handleBrandCreated = async (created) => {
    await refetchBrands();
    if (created?.id) setFormData((prev) => ({ ...prev, brandId: String(created.id) }));
  };

  const handleInventoryCreated = async (created) => {
    await refetchInventories();
    if (created?.id) setFormData((prev) => ({ ...prev, inventoryId: String(created.id) }));
  };

  // (p50) Igual que marca e inventario. Las categorías no vienen de
  // useMaterialCatalogs —son un catálogo propio de este módulo— así que la lista
  // se recarga aquí antes de autoseleccionar la recién creada.
  const handleCategoryCreated = async (creada) => {
    const lista = await categoryService.getAll().catch(() => null);
    if (lista) setCategoryOptions(toCategoryOptions(lista));
    if (creada?.id) setFormData((prev) => ({ ...prev, categoryId: String(creada.id) }));
  };

  // Lo recién cargado se autoselecciona: quien lo sube desde aquí es porque lo
  // quiere asignar a este material.
  const handleQuotationsUploaded = async (creadas = []) => {
    await cargarCotizaciones();
    if (!creadas.length) return;
    setFormData((prev) => {
      const juntas = [...new Set([...prev.quotationIds, ...creadas.map((c) => String(c.id))])];
      return { ...prev, quotationIds: juntas.slice(0, MAX_POR_MATERIAL) };
    });
  };

  // Reglas que el schema no puede ver: los archivos viven fuera de formData y la
  // obligatoriedad de las dimensiones depende del NOMBRE de la categoría.
  const erroresExtra = () => {
    const e = {};
    if (!images.length) e.image = "La imagen es requerida";
    if (!sheets.length) e.technicalSheet = "La ficha técnica es requerida (PDF o Excel)";
    if (showDimensions && !formData.dimensions) {
      e.dimensions = "Las dimensiones son obligatorias para muebles y enseres";
    }
    return e;
  };

  const validarPaso = (indice) => {
    const result = returnableMaterialSchema.safeParse(formData);
    const todos = {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        if (!(issue.path[0] in todos)) todos[issue.path[0]] = issue.message;
      });
    }
    Object.assign(todos, erroresExtra());

    const delPaso = {};
    CAMPOS_POR_PASO[indice].forEach((campo) => {
      if (todos[campo]) delPaso[campo] = todos[campo];
    });
    setErrors(delPaso);
    return Object.keys(delPaso).length === 0;
  };

  const handleSubmit = async () => {
    const result = returnableMaterialSchema.safeParse(formData);
    const extra = erroresExtra();
    // MultiStepModal ya validó los seis pasos; red de seguridad por si un campo
    // no estuviera asignado a ninguno.
    if (!result.success || Object.keys(extra).length) {
      Alert.error(
        "Faltan datos",
        Object.values(extra)[0] ?? result.error?.issues[0]?.message ?? "Revisa el formulario.",
      );
      return;
    }

    setGuardando(true);

    const fd = new FormData();
    Object.entries(result.data).forEach(([key, val]) => {
      // Con placa SENA la cantidad NO se envía (el "1" del input es solo visual;
      // el backend guarda null para identificar serializados)
      if (key === "quantity" && result.data.senaPlate) return;
      // Un FormData no puede llevar un array: cuentadantes y cotizaciones
      // viajan como JSON
      if (key === "accountableIds" || key === "quotationIds") {
        fd.append(key, JSON.stringify(val));
        return;
      }
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    // Repetir el mismo nombre de campo es la forma en que un FormData manda
    // varios archivos al mismo `fields({ name })` de multer
    images.forEach((file) => fd.append("image", file));
    sheets.forEach((file) => fd.append("technical_sheet", file));

    try {
      Alert.loading("Creando material...");
      await returnableMaterialService.create(fd);
      Alert.close();
      onSaved?.();
      onClose?.();
      Alert.success("Material creado");
    } catch (err) {
      Alert.close();
      const detalles = err.response?.data?.detalles;
      const mensaje = err.response?.data?.error ?? "Error al crear el material";
      Alert.error("Error al crear el material", detalles?.join(" · ") ?? mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const rejilla = (children) => (
    <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2">{children}</div>
  );

  const pasos = [
    {
      titulo: "Identificación",
      validate: () => validarPaso(0),
      contenido: (
        <div className="flex flex-col gap-5">
          {rejilla(
            <>
              <Input widthClass="w-full"
                label="ID del material" required
                value="Automático" readOnly
                title="Se genera automáticamente al guardar" />
              <Input widthClass="w-full"
                label="Nombre del material" name="materialName" required
                placeholder="Ej: Taladro percutor 1/2''"
                value={formData.materialName} onChange={handleChange} error={errors.materialName} />
            </>,
          )}
          <TextArea widthClass="w-full"
            label="Descripción" name="description" required
            placeholder="Ej: Taladro percutor para prácticas de instalación"
            value={formData.description} onChange={handleChange} error={errors.description} />
        </div>
      ),
    },
    {
      titulo: "Categoría y características",
      validate: () => validarPaso(1),
      contenido: (
        <div className="flex flex-col gap-6">
          {rejilla(
        <>
          <Select widthClass="w-full" variant="search"
            label="Categoría" name="categoryId" required
            options={categoryOptions}
            value={formData.categoryId} onChange={handleChange} error={errors.categoryId} />

          {/* (p48) Modelo y serial pasaron a opcionales: hay devolutivo sin ellos */}
          <Input widthClass="w-full"
            label="Modelo (opcional)" name="model"
            placeholder="Ej: GSB 550"
            value={formData.model} onChange={handleChange} error={errors.model} />

          <Input widthClass="w-full"
            label="Serial (opcional)" name="serial"
            placeholder="Ej: 4F72K19A"
            value={formData.serial} onChange={handleChange} error={errors.serial} />

          {/* Solo aparece para la categoría que las pide. Para el resto el campo
              ni se muestra y viaja vacío (el backend lo guarda como NULL). */}
          {showDimensions && (
            <Input widthClass="w-full"
              label="Dimensiones" name="dimensions" required
              placeholder="Ej: 120 × 60 × 75 cm"
              value={formData.dimensions} onChange={handleChange} error={errors.dimensions} />
          )}
        </>,
          )}

          <CreateAndAssignTrigger
            label="Crear y asignar nueva categoría"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex"
          />
        </div>
      ),
    },
    {
      titulo: "Inventario y ubicación",
      validate: () => validarPaso(2),
      contenido: (
        <div className="flex flex-col gap-6">
          {rejilla(
            <>
              {/* (p48) La marca dejó de ser obligatoria: hay material sin marca */}
              <Select widthClass="w-full" variant="search"
                label="Marca (opcional)" name="brandId"
                options={brandOptions}
                value={formData.brandId} onChange={handleChange} error={errors.brandId} />

              {/* (p48) El inventario sí lo es: todo material pertenece a uno */}
              <Select widthClass="w-full" variant="search"
                label="Inventario" name="inventoryId" required
                options={inventoryOptions}
                value={formData.inventoryId} onChange={handleChange} error={errors.inventoryId} />

              <Input widthClass="w-full"
                label="Ubicación" name="location" required
                placeholder="Ej: Bodega 2 — Estante A3"
                value={formData.location} onChange={handleChange} error={errors.location} />

              <Select widthClass="w-full"
                label="Estado" name="status" required
                options={STATUS_FILTER_OPTIONS}
                value={formData.status} onChange={handleChange} error={errors.status} />

              <div className="sm:col-span-2">
                <Input widthClass="w-full"
                  label="Placa SENA (opcional)" name="senaPlate"
                  placeholder="Ej: 92451234 (solo materiales serializados)"
                  value={formData.senaPlate} onChange={handleChange} error={errors.senaPlate} />
              </div>
            </>,
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <CreateAndAssignTrigger
              label="Crear y asignar nueva marca"
              onClick={() => setIsBrandModalOpen(true)}
              className="flex"
            />
            <CreateAndAssignTrigger
              label="Crear y asignar nuevo inventario"
              onClick={() => setIsInventoryModalOpen(true)}
              className="flex"
            />
          </div>
        </div>
      ),
    },
    {
      titulo: "Valores y cotizaciones",
      validate: () => validarPaso(3),
      contenido: rejilla(
        <>
          <div>
            <Input widthClass="w-full"
              label="Cantidad" name="quantity" type="number"
              placeholder="Ej: 25 (vacío si es serializado)"
              value={formData.quantity} onChange={handleChange} error={errors.quantity}
              disabled={!!formData.senaPlate} />
            {!formData.senaPlate && !errors.quantity && (
              <p className="mt-1 font-secondary text-caption text-text-muted">
                Requerida cuando no hay Placa SENA
              </p>
            )}
          </div>

          <Input widthClass="w-full"
            label="Valor unitario" name="unitPrice" required prefix="$" type="number"
            placeholder="Ej: 310000 (COP, sin puntos)"
            value={formData.unitPrice} onChange={handleChange} error={errors.unitPrice} />

          <Input widthClass="w-full"
            label="Valor total" name="totalPrice" required prefix="$" type="number"
            placeholder="Se calcula: cantidad × valor unitario"
            value={formData.totalPrice} onChange={handleChange} error={errors.totalPrice} />

          <Input widthClass="w-full"
            label="Fecha de compra" name="purchaseDate" required type="date"
            value={formData.purchaseDate} onChange={handleChange} error={errors.purchaseDate} />

          {/* (p48) Fecha de ingreso al almacén: nunca anterior a la de compra */}
          <Input widthClass="w-full"
            label="Fecha de ingreso" name="entryDate" required type="date"
            min={formData.purchaseDate || undefined}
            value={formData.entryDate} onChange={handleChange} error={errors.entryDate} />

          {/* (p50) Respaldo del precio. En este paso y no en el de archivos:
              una cotización no es documentación del material, es lo que justifica
              el valor escrito arriba. El ojo abre el PDF sin marcarla. */}
          <div className="sm:col-span-2 flex flex-col gap-4">
            <Select widthClass="w-full sm:max-w-md" variant="search" multiple
              label="Cotizaciones" name="quotationIds" required
              options={quotationOptions}
              maxSelected={MAX_POR_MATERIAL}
              onPreview={(opt) => {
                const url = quotationUrl(opt.quotation);
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }}
              previewIcon={<Eye size={16} />}
              previewLabel="Ver cotización"
              value={formData.quotationIds} onChange={handleChange}
              error={errors.quotationIds} />

            <CreateAndAssignTrigger
              label="Cargar y asignar nuevas cotizaciones"
              onClick={() => setIsQuotationModalOpen(true)}
              className="flex"
            />
          </div>
        </>,
      ),
    },
    {
      titulo: "Cuentadantes",
      validate: () => validarPaso(4),
      contenido: (
        <div className="flex flex-col gap-4">
          <p className="font-secondary text-body text-text-muted">
            Quiénes responden por este material. Se puede asignar más de uno.
          </p>
          <Select widthClass="w-full sm:max-w-md" variant="search" multiple
            label="Cuentadantes" name="accountableIds" required
            options={accountableOptions}
            value={formData.accountableIds} onChange={handleChange}
            error={errors.accountableIds} />
        </div>
      ),
    },
    {
      titulo: "Imágenes y ficha técnica",
      validate: () => validarPaso(5),
      contenido: (
        <MaterialFilesBand
          images={images}
          sheets={sheets}
          onImagesChange={setImages}
          onSheetsChange={setSheets}
          imageError={errors.image}
          sheetError={errors.technicalSheet}
        />
      ),
    },
  ];

  return (
    <>
      <MultiStepModal
        isOpen
        onClose={onClose}
        titulo="Crear material devolutivo"
        pasos={pasos}
        onSubmit={handleSubmit}
        textoGuardar="Crear Material"
        guardando={guardando}
      />

      <CreateBrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSave={handleBrandCreated}
      />

      <CreateInventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        onSave={handleInventoryCreated}
      />

      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleCategoryCreated}
      />

      {/* Tope de 3 y no de 6: aquí se carga para ASIGNAR en el acto. */}
      <UploadQuotationsModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        onSave={handleQuotationsUploaded}
        maxFiles={MAX_POR_CARGA_EN_MATERIAL}
      />
    </>
  );
}
