import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input, Button, Select, FileInput, TextArea, Alert, CreateAndAssignTrigger,
} from "@/shared";
import { consumableMaterialSchema } from "../schemas/consumableMaterialSchema";
import consumableMaterialService from "@/shared/services/consumableMaterialService";
import CreateBrandModal from "@/shared/components/brands/CreateBrandModal";
import CreateInventoryModal from "@/shared/components/inventories/CreateInventoryModal";
import { useMaterialCatalogs } from "@/shared/hooks/useMaterialCatalogs";
import { STATUS_FILTER_OPTIONS } from "@/shared/utils/materialStatusLabel";
import { calcularTotal } from "@/shared/utils/materialTotal";
import {
  MAX_IMAGES,
  MAX_TECHNICAL_SHEETS,
  IMAGE_ACCEPT,
  TECHNICAL_SHEET_ACCEPT,
} from "@/shared/utils/materialFiles";

// ---------------------------------------------------------------------------
// (p48) Este formulario dejó de ser el hermano pobre del devolutivo.
//
// Ganó: ficha técnica (obligatoria, hasta 3), hasta 3 imágenes, inventario,
// varios cuentadantes y fecha de ingreso; y perdió la obligatoriedad de la
// marca. Lo único que sigue distinguiéndolo del devolutivo es lo que NO tiene:
// categoría, modelo, serial y dimensiones.
//
// Distribución — retícula de CSS, sin JavaScript.
//
// Antes esto se resolvía construyendo las columnas a mano: un array de campos
// cortado por una tabla SPLIT según cuántas columnas cupieran, medidas con el
// hook useColumnCount. Se eliminó (sesión 4) porque medir el ancho en JS para
// decidir el layout es hardcodear la responsividad, y el proyecto lo prohíbe.
//
// El motivo por el que existía era real: en una retícula las FILAS SE COMPARTEN,
// así que la descripción —un TextArea que mide el alto de dos inputs— estiraba
// su fila y abría un hueco muerto al lado.
//
// La solución sin JS es no mezclarlo con los demás: el TextArea va el ÚLTIMO y
// ocupa la fila entera (`col-span-full`). Ninguna fila combina entonces un campo
// alto con campos bajos, y `items-start` evita que nada se estire.
// ---------------------------------------------------------------------------

export default function ConsumableMaterialRegisterForm() {
  const navigate = useNavigate();

  const {
    brandOptions, inventoryOptions, accountableOptions,
    refetchBrands, refetchInventories,
  } = useMaterialCatalogs();

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  const [images, setImages] = useState([]);
  const [sheets, setSheets] = useState([]);

  const [formData, setFormData] = useState({
    materialName:   "",
    brandId:        "",
    inventoryId:    "",
    accountableIds: [],
    senaPlate:      "",
    location:       "",
    quantity:       "",
    status:         "",
    unitPrice:      "",
    totalPrice:     "",
    purchaseDate:   "",
    entryDate:      "",
    description:    "",
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
        const total = calcularTotal(next.quantity, name === "unitPrice" ? value : prev.unitPrice);
        if (total !== null) next.totalPrice = total;
      }
      return next;
    });
  };

  // Al crear una marca o un inventario desde su modal se refresca el select y
  // se autoselecciona lo recién creado
  const handleBrandCreated = async (created) => {
    await refetchBrands();
    if (created?.id) setFormData((prev) => ({ ...prev, brandId: String(created.id) }));
  };

  const handleInventoryCreated = async (created) => {
    await refetchInventories();
    if (created?.id) setFormData((prev) => ({ ...prev, inventoryId: String(created.id) }));
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

    // Los archivos viven fuera de formData, así que el schema no los ve.
    // (p48) La ficha técnica es obligatoria también aquí, igual que en devolutivo.
    const extraErrors = {};
    if (!images.length) extraErrors.image = "La imagen es requerida";
    if (!sheets.length) extraErrors.technicalSheet = "La ficha técnica es requerida (PDF o Excel)";
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
      // Un FormData no puede llevar un array: los cuentadantes viajan como JSON
      if (key === "accountableIds") { fd.append(key, JSON.stringify(val)); return; }
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    // Repetir el mismo nombre de campo es la forma en que un FormData manda
    // varios archivos al mismo `fields({ name })` de multer
    images.forEach((file) => fd.append("image", file));
    sheets.forEach((file) => fd.append("technical_sheet", file));

    try {
      Alert.loading("Creando material...");
      await consumableMaterialService.create(fd);
      Alert.close();
      Alert.success("Material creado");
      navigate("/dashboard/consumable-materials");
    } catch (err) {
      Alert.close();
      const detalles = err.response?.data?.detalles;
      const mensaje = err.response?.data?.error ?? "Error al crear el material";
      Alert.error("Error al crear el material", detalles?.join(" · ") ?? mensaje);
    } finally {
      setSaving(false);
    }
  };

  // Una sola previsualización visible y flechas para recorrer las demás. Antes
  // esto dependía de un useMediaQuery que miraba el ancho; se eliminó (sesión 4)
  // porque decidir cuánto se renderiza midiendo el ancho en JS es hardcodear la
  // responsividad.
  const previewCount = 1;

  const triggers = (
    <>
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
    </>
  );

  return (
    <div className="flex justify-center pt-4">
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8).
          w-fit solo desde 1400: ajusta la tarjeta al contenido, y con menos
          columnas eso dejaría a los campos sin ancho al que crecer. */}
      <div className="bg-white rounded-xl shadow-sm p-8 mx-6 w-full md:mx-12 1400:mx-0 1400:w-fit">
        <form
          className="flex flex-col items-center gap-8 lg:flex-row lg:items-start"
          onSubmit={handleSubmit}
        >
          {/* Columna de archivos: hermana de las columnas de campos, NO parte de
              ellas. Así su altura (vacía o con previsualizaciones) es
              independiente y nunca desplaza a los campos. */}
          <div className="flex flex-col items-center gap-6 shrink-0 sm:items-start lg:items-center lg:w-45 1400:gap-8">
            <FileInput
              accept={IMAGE_ACCEPT}
              multiple
              maxFiles={MAX_IMAGES}
              label="Cargar imagen"
              required
              replaceLabel="Reemplazar imagen"
              directionClassName="flex-col-reverse sm:flex-row-reverse lg:flex-col-reverse"
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
              directionClassName="flex-col-reverse sm:flex-row-reverse lg:flex-col-reverse"
              visibleCount={previewCount}
              value={sheets}
              onChange={setSheets}
              error={errors.technicalSheet}
            />

            <p className="font-secondary text-caption text-text-muted text-center sm:text-left lg:text-center">
              Hasta {MAX_IMAGES} imágenes y {MAX_TECHNICAL_SHEETS} fichas técnicas en PDF o Excel
            </p>

            <div className="hidden flex-col gap-6 lg:flex">{triggers}</div>
          </div>

          {/* Campos: retícula que crece de 1 a 3 columnas según el ancho.
              `items-start` impide que un campo estire a sus vecinos de fila. */}
          <div className="grid w-full grid-cols-1 items-start gap-6 lg:w-auto lg:grid-cols-2 1400:grid-cols-3">
            <Input widthClass="w-full lg:w-[320px]"
              label="ID del material" required
              value="Automático" readOnly
              title="Se genera automáticamente al guardar" />

            <Input widthClass="w-full lg:w-[320px]"
              label="Nombre del material" name="materialName" required
              placeholder="Ej: Tornillos autoperforantes 1/2''"
              value={formData.materialName} onChange={handleChange} error={errors.materialName} />

            {/* (p48) La marca dejó de ser obligatoria: hay material sin marca */}
            <Select widthClass="w-full lg:w-[320px]" variant="search"
              label="Marca (opcional)" name="brandId"
              options={brandOptions}
              value={formData.brandId} onChange={handleChange} error={errors.brandId} />

            {/* (p48) El inventario sí lo es: todo material pertenece a uno */}
            <Select widthClass="w-full lg:w-[320px]" variant="search"
              label="Inventario" name="inventoryId" required
              options={inventoryOptions}
              value={formData.inventoryId} onChange={handleChange} error={errors.inventoryId} />

            <Input widthClass="w-full lg:w-[320px]"
              label="Placa SENA (opcional)" name="senaPlate"
              placeholder="Ej: 92451234 (solo materiales serializados)"
              value={formData.senaPlate} onChange={handleChange} error={errors.senaPlate} />

            {/* (p48) Varios cuentadantes: variante secundaria del Select
                (casillas) sobre la primaria de búsqueda. El disparador resume
                "el primero y N más" cuando no caben todos. */}
            <Select widthClass="w-full lg:w-[320px]" variant="search" multiple
              label="Cuentadantes" name="accountableIds" required
              options={accountableOptions}
              value={formData.accountableIds} onChange={handleChange}
              error={errors.accountableIds} />

            <Input widthClass="w-full lg:w-[320px]"
              label="Ubicación" name="location" required
              placeholder="Ej: Bodega 2 — Estante A3"
              value={formData.location} onChange={handleChange} error={errors.location} />

            <Select widthClass="w-full lg:w-[320px]"
              label="Estado" name="status" required
              options={STATUS_FILTER_OPTIONS}
              value={formData.status} onChange={handleChange} error={errors.status} />

            {/* Cantidad lleva una nota debajo. Va ABSOLUTA sobre el gap de la retícula:
                en flujo normal sumaría altura y separaría este campo del siguiente
                más que al resto. */}
            <div className="relative w-full lg:w-[320px]">
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
            </div>

            <Input widthClass="w-full lg:w-[320px]"
              label="Valor unitario" name="unitPrice" required prefix="$" type="number"
              placeholder="Ej: 31000 (COP, sin puntos)"
              value={formData.unitPrice} onChange={handleChange} error={errors.unitPrice} />

            <Input widthClass="w-full lg:w-[320px]"
              label="Valor total" name="totalPrice" required prefix="$" type="number"
              placeholder="Se calcula: cantidad × valor unitario"
              value={formData.totalPrice} onChange={handleChange} error={errors.totalPrice} />

            <Input widthClass="w-full lg:w-[320px]"
              label="Fecha de compra" name="purchaseDate" required type="date"
              value={formData.purchaseDate} onChange={handleChange} error={errors.purchaseDate} />

            {/* (p48) Fecha de ingreso al almacén: nunca anterior a la de compra */}
            <Input widthClass="w-full lg:w-[320px]"
              label="Fecha de ingreso" name="entryDate" required type="date"
              min={formData.purchaseDate || undefined}
              value={formData.entryDate} onChange={handleChange} error={errors.entryDate} />

            {/* La descripción va la ÚLTIMA y ocupa la fila entera: es lo que permite
                quitar el reparto en JS. Al no compartir fila con ningún campo bajo,
                su altura ya no abre huecos. */}
            <TextArea widthClass="w-full" className="col-span-full"
              label="Descripción" name="description" required
              placeholder="Ej: Caja de tornillos autoperforantes para formación en estructuras metálicas"
              value={formData.description} onChange={handleChange} error={errors.description} />
          </div>
        </form>

        {/* Disparadores (hasta md) y botón, fuera de la retícula para que su
            posición no dependa del reparto. El botón va SIEMPRE centrado. */}
        <div className="mt-8 flex flex-col items-center gap-6 sm:items-start md:items-center lg:hidden">
          {triggers}
        </div>

        <div className="mt-6 flex justify-center">
          <Button type="submit" variant="primary" size="sm" disabled={saving} onClick={handleSubmit}>
            {saving ? "Guardando..." : "Crear Material"}
          </Button>
        </div>

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
      </div>
    </div>
  );
}
