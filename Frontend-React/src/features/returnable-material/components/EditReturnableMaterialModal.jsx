// Editar material devolutivo — modal (reemplaza a /view/returnable-materials/:id/edit).
//
// Al ser un formulario NO se cierra con clic fuera —se perdería lo escrito—:
// solo con Cancelar o con la X, que va por fuera del modal en una esquina.
//
// Diferencia deliberada con los modales de editar usuario y material de consumo:
// allí la columna izquierda es la imagen (una sola caja de 96px) y cabe de sobra
// en 220px. Aquí hay DOS file inputs y cada uno enseña hasta tres
// previsualizaciones: la tira mide ~400px y en una columna lateral empujaría los
// campos fuera del modal. Por eso los archivos van en una banda superior a todo
// el ancho y los campos debajo; la segmentación (archivos primero, luego datos)
// es la misma, solo cambia la dirección.

import { useEffect, useState } from "react";
import { Modal, Input, Select, TextArea, Button, FileInput, Alert, useMediaQuery } from "@/shared";
import { Save } from "lucide-react";
import returnableMaterialService from "../services/returnableMaterialService";
import categoryService from "../services/categoryService";
import brandService from "@/features/brands/services/brandService";
import userService from "@/features/users/services/userService";
import { returnableMaterialUpdateSchema } from "../schemas/returnableMaterialSchema";
import { STATUS_FILTER_OPTIONS } from "../utils/statusLabel";
import {
  MAX_IMAGES,
  MAX_TECHNICAL_SHEETS,
  IMAGE_ACCEPT,
  TECHNICAL_SHEET_ACCEPT,
  requiresDimensions,
  categoryNameOf,
} from "../utils/materialFiles";

const API_FILES = "http://localhost:5000";

// Huecos reservados en las dos tiras: la del material devolutivo apunta a tres
// imágenes y tres fichas, aunque hoy la imagen sea una sola
const FILE_SLOTS = 3;

// Dirección de las previsualizaciones dentro de cada file input:
// - hasta sm: debajo de la caja (a 360px una fila de caja + tira no cabe)
// - desde sm: a la derecha, en fila
const FILES_DIRECTION = "flex-col-reverse sm:flex-row-reverse";

// Un archivo ya guardado, descrito como lo espera FileInput (que distingue File
// de descriptor remoto para no revocar una URL que no creó)
const remoteSheet = (sheet) => ({
  id:   sheet.id,
  url:  `${API_FILES}${sheet.fileUrl}`,
  name: sheet.fileName,
  type: sheet.mimeType,
});

const remoteImage = (url) => ({
  url:  `${API_FILES}${url}`,
  name: url.split("/").pop(),
  type: "image/*",
});

const isNewFile = (item) => item instanceof File;

export default function EditReturnableMaterialModal({ isOpen, materialId, onClose, onSaved }) {
  const [brandOptions, setBrandOptions]       = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [userOptions, setUserOptions]         = useState([]);
  const [form, setForm]                       = useState(null);
  // Las dos tiras mezclan lo ya guardado (descriptores) con lo recién elegido
  // (File): así arrastrar y eliminar funcionan igual sin importar el origen
  const [images, setImages]                   = useState([]);
  const [sheets, setSheets]                   = useState([]);
  const [errors, setErrors]                   = useState({});
  const [saving, setSaving]                   = useState(false);
  const [loadError, setLoadError]             = useState(null);

  useEffect(() => {
    if (!isOpen || !materialId) return;

    (async () => {
      // Estado limpio en cada apertura: si no, al abrir un segundo material se
      // verían por un instante los datos del anterior
      setForm(null);
      setImages([]);
      setSheets([]);
      setErrors({});
      setLoadError(null);
      try {
        const m  = await returnableMaterialService.getById(materialId);
        const cm = m.consumableMaterial;
        setForm({
          materialName: cm.materialName ?? "",
          brandId:      String(cm.brandId ?? ""),
          categoryId:   String(m.categoryId ?? ""),
          userId:       String(cm.userId ?? ""),
          senaPlate:    cm.senaPlate ?? "",
          // Con placa SENA (serializado, quantity null en BD) se muestra 1 fijo
          quantity:     cm.quantity != null ? String(cm.quantity) : (cm.senaPlate ? "1" : ""),
          location:     cm.location ?? "",
          status:       cm.status ?? "",
          unitPrice:    String(cm.unitPrice ?? ""),
          totalPrice:   String(cm.totalPrice ?? ""),
          purchaseDate: cm.purchaseDate ? cm.purchaseDate.slice(0, 10) : "",
          description:  cm.description ?? "",
          model:        m.model ?? "",
          serial:       m.serial ?? "",
          dimensions:   m.dimensions ?? "",
        });
        setImages(cm.image ? [remoteImage(cm.image)] : []);
        setSheets((m.technicalSheets ?? []).map(remoteSheet));
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el material");
      }
    })();

    brandService.getAll()
      .then((b) => setBrandOptions(b.map((x) => ({ value: String(x.id), label: x.brandName }))))
      .catch(() => {});

    categoryService.getAll()
      .then((c) => setCategoryOptions(c.map((x) => ({ value: String(x.id), label: x.categoryName }))))
      .catch(() => {});

    // El SADMIN ya viene excluido por el backend (systemIdentities.js)
    userService.getAll()
      .then((users) =>
        setUserOptions(
          users
            .filter((u) => u.userAccountType === "Cuentadante")
            .map((u) => ({ value: String(u.id), label: `${u.userFirstName} ${u.userLastName}` })),
        ),
      )
      .catch(() => {});
  }, [isOpen, materialId]);

  const categoryName = categoryNameOf(categoryOptions, form?.categoryId);
  const showDimensions = requiresDimensions(categoryName);

  // Debajo de sm el ancho útil del modal es ~280px: no caben la caja y las tres
  // previsualizaciones. Ahí se ve una y las flechas recorren el resto; desde sm
  // se ven las tres, que es lo que pide el diseño.
  const isSm = useMediaQuery("(min-width: 40rem)");
  const previewCount = isSm ? undefined : 1;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Placa SENA ⇒ cantidad fija en 1 (visual) y bloqueada; sin placa se vacía.
      // Al guardar, la cantidad de serializados no se envía (queda null en BD)
      if (name === "senaPlate") {
        next.quantity = value ? "1" : "";
      }
      // Valor total auto: cantidad × valor unitario (cantidad vacía ⇒ 1);
      // el usuario puede sobrescribirlo manualmente
      if (name === "quantity" || name === "unitPrice" || name === "senaPlate") {
        const rawQ = next.quantity;
        const q = rawQ === "" ? 1 : Number(rawQ);
        const u = Number(name === "unitPrice" ? value : prev.unitPrice);
        if (q > 0 && u > 0) next.totalPrice = String(q * u);
      }
      // Al pasar a una categoría que no pide dimensiones se limpia lo escrito
      if (name === "categoryId" && !requiresDimensions(categoryNameOf(categoryOptions, value))) {
        next.dimensions = "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const result = returnableMaterialUpdateSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0]] = issue.message; });
      setErrors(fieldErrors);
      return;
    }

    // Reglas que el schema no ve: los archivos viven fuera de `form` y las
    // dimensiones dependen del nombre de la categoría
    const extraErrors = {};
    if (!images.length) extraErrors.image = "El material debe conservar una imagen";
    if (!sheets.length) extraErrors.technicalSheet = "El material debe conservar al menos una ficha técnica";
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
      // Con placa SENA la cantidad NO se envía (el "1" del input es solo visual)
      if (key === "quantity" && result.data.senaPlate) return;
      // Dimensiones vacías SÍ se envían: es como se borra la medida al cambiar
      // de categoría (el backend las convierte en NULL)
      if (key === "dimensions") { fd.append(key, val ?? ""); return; }
      if (val !== undefined && val !== "") fd.append(key, val);
    });

    // Solo se sube la imagen si de verdad se eligió otra
    const nuevaImagen = images.find(isNewFile);
    if (nuevaImagen) fd.append("image", nuevaImagen);

    // El orden final se manda explícito: mezcla ids ya guardados con
    // referencias "new:<i>" a los archivos de esta petición, para que arrastrar
    // una ficha nueva al principio no la mande al final al guardar
    const nuevasFichas = sheets.filter(isNewFile);
    const sheetOrder = sheets.map((item) =>
      isNewFile(item) ? `new:${nuevasFichas.indexOf(item)}` : item.id,
    );
    fd.append("sheetOrder", JSON.stringify(sheetOrder));
    nuevasFichas.forEach((file) => fd.append("technical_sheet", file));

    try {
      Alert.loading("Actualizando material...");
      await returnableMaterialService.update(materialId, fd);
      Alert.close();
      Alert.success("Material actualizado");
      onSaved?.();
      onClose?.();
    } catch (err) {
      Alert.close();
      const det = err.response?.data?.detalles;
      const msg = det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al actualizar");
      Alert.error("Error al actualizar el material", msg);
      setErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar material devolutivo"
      // xl y más columnas cuanto más ancho: el modal reparte los 15 campos en
      // 2 columnas desde sm, 3 desde lg y 4 en 1400. Cada columna que se suma
      // quita filas, que es lo único que baja el alto — y con ello el scroll.
      size="xl"
      // Formulario: un clic fuera no puede descartar lo escrito
      closeOnBackdrop={false}
      closeButtonOutside
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" className="gap-2" onClick={handleSubmit} disabled={saving || !form}>
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      {loadError ? (
        <p className="text-error font-secondary">{loadError}</p>
      ) : !form ? (
        <p className="text-text-muted font-secondary">Cargando material...</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6">

          {/* Banda de archivos.
              Una sola columna hasta lg: cada file input con sus tres huecos mide
              ~408px (caja + 3 previsualizaciones + gaps) y no encoge, así que a
              768px dos columnas se pisaban. Recién a partir de lg hay ancho para
              las dos.
              Debajo de sm ni siquiera cabe uno: ahí la tira baja a una
              previsualización con flechas y se coloca bajo la caja. */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 border-b border-border pb-6">
            <div className="flex flex-col gap-2">
              <FileInput
                accept={IMAGE_ACCEPT}
                multiple={MAX_IMAGES > 1}
                maxFiles={MAX_IMAGES}
                label="Imagen del material"
                replaceLabel="Reemplazar imagen"
                required
                slots={FILE_SLOTS}
                directionClassName={FILES_DIRECTION}
                visibleCount={previewCount}
                value={images}
                onChange={setImages}
                error={errors.image}
              />
              <p className="font-secondary text-caption text-text-muted">
                {MAX_IMAGES === 1
                  ? "Una imagen (JPG o PNG). El espacio de las otras dos queda reservado."
                  : `Hasta ${MAX_IMAGES} imágenes (JPG o PNG).`}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <FileInput
                accept={TECHNICAL_SHEET_ACCEPT}
                multiple
                maxFiles={MAX_TECHNICAL_SHEETS}
                label="Fichas técnicas"
                required
                slots={FILE_SLOTS}
                directionClassName={FILES_DIRECTION}
                visibleCount={previewCount}
                value={sheets}
                onChange={setSheets}
                error={errors.technicalSheet}
              />
              <p className="font-secondary text-caption text-text-muted">
                Hasta {MAX_TECHNICAL_SHEETS} archivos PDF o Excel. Arrastra para reordenar.
              </p>
            </div>
          </div>

          {/* Campos. 3 columnas desde 1400 para bajar el número de filas y que
              el modal quepa sin scroll */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 1400:grid-cols-4 justify-items-center sm:justify-items-stretch">
            <Input
              label="Nombre del material"
              name="materialName"
              required
              value={form.materialName}
              onChange={handleChange}
              error={errors.materialName}
            />
            <Select
              label="Marca"
              variant="search"
              name="brandId"
              required
              options={brandOptions}
              value={form.brandId}
              onChange={handleChange}
              error={errors.brandId}
            />
            <Select
              label="Categoría"
              variant="search"
              name="categoryId"
              required
              options={categoryOptions}
              value={form.categoryId}
              onChange={handleChange}
              error={errors.categoryId}
            />
            <Input
              label="Modelo"
              name="model"
              required
              value={form.model}
              onChange={handleChange}
              error={errors.model}
            />
            <Input
              label="Serial"
              name="serial"
              required
              value={form.serial}
              onChange={handleChange}
              error={errors.serial}
            />
            <Input
              label="Placa SENA (opcional)"
              name="senaPlate"
              value={form.senaPlate}
              onChange={handleChange}
              error={errors.senaPlate}
            />
            {/* Dimensiones solo para "Muebles y enseres": se quita del árbol en
                vez de ocultarse, así no deja un hueco en la rejilla */}
            {showDimensions && (
              <Input
                label="Dimensiones"
                name="dimensions"
                required
                value={form.dimensions}
                onChange={handleChange}
                error={errors.dimensions}
              />
            )}
            <Select
              label="Cuentadante"
              variant="search"
              name="userId"
              required
              options={userOptions}
              value={form.userId}
              onChange={handleChange}
              error={errors.userId}
            />
            <Input
              label="Ubicación"
              name="location"
              required
              value={form.location}
              onChange={handleChange}
              error={errors.location}
            />
            <Select
              label="Estado"
              name="status"
              required
              options={STATUS_FILTER_OPTIONS}
              value={form.status}
              onChange={handleChange}
              error={errors.status}
            />
            <Input
              label="Cantidad"
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={handleChange}
              error={errors.quantity}
              disabled={!!form.senaPlate}
              title={form.senaPlate ? "Material serializado: la cantidad es siempre 1" : undefined}
            />
            <Input
              label="Valor unitario"
              name="unitPrice"
              required
              prefix="$"
              type="number"
              value={form.unitPrice}
              onChange={handleChange}
              error={errors.unitPrice}
            />
            <Input
              label="Valor total"
              name="totalPrice"
              required
              prefix="$"
              type="number"
              value={form.totalPrice}
              onChange={handleChange}
              error={errors.totalPrice}
            />
            <Input
              label="Fecha de compra"
              name="purchaseDate"
              required
              type="date"
              value={form.purchaseDate}
              onChange={handleChange}
              error={errors.purchaseDate}
            />

            <TextArea
              className="sm:col-span-2 lg:col-span-3 1400:col-span-4"
              widthClass="w-full"
              label="Descripción"
              name="description"
              required
              value={form.description}
              onChange={handleChange}
              error={errors.description}
            />

            {errors.form && (
              <p className="font-secondary text-error text-caption sm:col-span-2 lg:col-span-3 1400:col-span-4">
                {errors.form}
              </p>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
