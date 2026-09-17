// Editar material de consumo — modal (reemplaza a /view/consumable-materials/:id/edit).
//
// Al ser un formulario NO se cierra con clic fuera —se perdería lo escrito—:
// solo con Cancelar o con la X, que va por fuera del modal en una esquina.
//
// (p48) Este modal se acercó al de devolutivo: la imagen suelta de la columna
// izquierda dio paso a la banda superior de archivos compartida, con las hasta 3
// imágenes y las hasta 3 fichas técnicas. La segmentación es la misma que allí
// (archivos primero, datos debajo) porque ahora tienen el mismo contenido.

import { useEffect, useState } from "react";
import { Modal, Input, Select, TextArea, Button, Alert } from "@/shared";
import { Save } from "lucide-react";
import MaterialFilesBand from "@/shared/components/materials/MaterialFilesBand";
import consumableMaterialService from "@/shared/services/consumableMaterialService";
import { consumableMaterialUpdateSchema } from "../schemas/consumableMaterialSchema";
import { STATUS_FILTER_OPTIONS } from "@/shared/utils/materialStatusLabel";
import { calcularTotal } from "@/shared/utils/materialTotal";
import { useMaterialCatalogs, ensureOption, ensureOptions } from "@/shared/hooks/useMaterialCatalogs";
import { accountableIds } from "@/shared/utils/accountables";
import { remoteImage, remoteSheet, buildFileOrder } from "@/shared/utils/materialFiles";

export default function EditConsumableMaterialModal({ isOpen, materialId, onClose, onSaved }) {
  const { brandOptions, inventoryOptions, accountableOptions } = useMaterialCatalogs(isOpen);

  const [form, setForm]     = useState(null);
  // Las dos tiras mezclan lo ya guardado (descriptores) con lo recién elegido
  // (File): así arrastrar y eliminar funcionan igual sin importar el origen
  const [images, setImages] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // Marca e inventario del material tal como venían: si alguno se desactivó
  // después, no estará entre las opciones y hay que reponerlo para no borrarlo
  // sin querer al guardar
  const [origen, setOrigen] = useState({ brand: null, inventory: null, accountables: [] });

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
        const m = await consumableMaterialService.getById(materialId);
        setForm({
          materialName:   m.materialName ?? "",
          brandId:        String(m.brandId ?? ""),
          inventoryId:    String(m.inventoryId ?? ""),
          accountableIds: accountableIds(m.accountables),
          senaPlate:      m.senaPlate ?? "",
          // Con placa SENA (serializado, quantity null en BD) se muestra 1 fijo
          quantity:       m.quantity != null ? String(m.quantity) : (m.senaPlate ? "1" : ""),
          location:       m.location ?? "",
          status:         m.status ?? "",
          unitPrice:      String(m.unitPrice ?? ""),
          totalPrice:     String(m.totalPrice ?? ""),
          purchaseDate:   m.purchaseDate ? m.purchaseDate.slice(0, 10) : "",
          entryDate:      m.entryDate ? m.entryDate.slice(0, 10) : "",
          description:    m.description ?? "",
        });
        setOrigen({
          brand: m.brand ?? null,
          inventory: m.inventory ?? null,
          accountables: m.accountables ?? [],
        });
        setImages((m.images ?? []).map(remoteImage));
        setSheets((m.technicalSheets ?? []).map(remoteSheet));
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el material");
      }
    })();
  }, [isOpen, materialId]);

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
        const total = calcularTotal(next.quantity, name === "unitPrice" ? value : prev.unitPrice);
        if (total !== null) next.totalPrice = total;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const result = consumableMaterialUpdateSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0]] = issue.message; });
      setErrors(fieldErrors);
      return;
    }

    // Los archivos viven fuera de `form`, así que el schema no los ve. El
    // backend exige que quede al menos una imagen y una ficha
    const extraErrors = {};
    if (!images.length) extraErrors.image = "El material debe conservar al menos una imagen";
    if (!sheets.length) extraErrors.technicalSheet = "El material debe conservar al menos una ficha técnica";
    if (Object.keys(extraErrors).length) {
      setErrors(extraErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const fd = new FormData();
    Object.entries(result.data).forEach(([key, val]) => {
      // Placa y cantidad se envían SIEMPRE, incluso vacías: el vacío es como se
      // quitan (el backend los convierte en null). Con placa, la cantidad viaja
      // vacía —el "1" del input es solo visual— porque un material serializado
      // se identifica justamente por tener quantity null.
      // Antes se omitían cuando estaban vacías, así que borrar la placa no hacía
      // nada y poner una a un material con cantidad dejaba las dos a la vez.
      if (key === "quantity")  { fd.append(key, result.data.senaPlate ? "" : (val ?? "")); return; }
      if (key === "senaPlate") { fd.append(key, val ?? ""); return; }
      // Un FormData no puede llevar un array: los cuentadantes viajan como JSON
      if (key === "accountableIds") { fd.append(key, JSON.stringify(val)); return; }
      // La marca vacía SÍ se envía: es como se le quita la marca a un material
      // (el backend la convierte en NULL). Ya es un campo opcional (p48)
      if (key === "brandId") { fd.append(key, val ?? ""); return; }
      if (val !== undefined && val !== "") fd.append(key, val);
    });

    // El orden final se manda explícito: mezcla ids ya guardados con
    // referencias "new:<i>" a los archivos de esta petición, para que arrastrar
    // uno nuevo al principio no lo mande al final al guardar. Lo que no aparezca
    // en la lista, el backend lo elimina.
    const imagenes = buildFileOrder(images);
    fd.append("imageOrder", JSON.stringify(imagenes.order));
    imagenes.nuevos.forEach((file) => fd.append("image", file));

    const fichas = buildFileOrder(sheets);
    fd.append("sheetOrder", JSON.stringify(fichas.order));
    fichas.nuevos.forEach((file) => fd.append("technical_sheet", file));

    try {
      Alert.loading("Actualizando material...");
      await consumableMaterialService.update(materialId, fd);
      Alert.close();
      Alert.success("Material actualizado");
      onSaved?.();
      onClose?.();
    } catch (err) {
      Alert.close();
      const det = err.response?.data?.detalles;
      const msg = det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al actualizar");
      Alert.error("Error al actualizar el material", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar material de consumo"
      // xl y más columnas cuanto más ancho: cada columna que se suma quita
      // filas, que es lo único que baja el alto — y con ello el scroll.
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

          <MaterialFilesBand
            images={images}
            sheets={sheets}
            onImagesChange={setImages}
            onSheetsChange={setSheets}
            imageError={errors.image}
            sheetError={errors.technicalSheet}
          />

          {/* Campos. Más columnas cuanto más ancho para bajar el número de filas
              y que el modal quepa sin scroll */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 1400:grid-cols-4 justify-items-center sm:justify-items-stretch">
            <Input
              label="Nombre del material"
              name="materialName"
              required
              value={form.materialName}
              onChange={handleChange}
              error={errors.materialName}
            />
            {/* (p48) La marca dejó de ser obligatoria */}
            <Select
              label="Marca (opcional)"
              variant="search"
              name="brandId"
              options={ensureOption(brandOptions, form.brandId, origen.brand?.brandName)}
              value={form.brandId}
              onChange={handleChange}
              error={errors.brandId}
            />
            {/* (p48) El inventario sí lo es */}
            <Select
              label="Inventario"
              variant="search"
              name="inventoryId"
              required
              options={ensureOption(inventoryOptions, form.inventoryId, origen.inventory?.inventoryName)}
              value={form.inventoryId}
              onChange={handleChange}
              error={errors.inventoryId}
            />
            <Input
              label="Placa SENA (opcional)"
              name="senaPlate"
              value={form.senaPlate}
              onChange={handleChange}
              error={errors.senaPlate}
            />
            {/* (p48) Varios cuentadantes, con casillas y buscador */}
            <Select
              label="Cuentadantes"
              variant="search"
              multiple
              name="accountableIds"
              required
              options={ensureOptions(accountableOptions, origen.accountables)}
              value={form.accountableIds}
              onChange={handleChange}
              error={errors.accountableIds}
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
            {/* (p48) Fecha de ingreso al almacén: nunca anterior a la de compra */}
            <Input
              label="Fecha de ingreso"
              name="entryDate"
              required
              type="date"
              min={form.purchaseDate || undefined}
              value={form.entryDate}
              onChange={handleChange}
              error={errors.entryDate}
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

          </div>
        </form>
      )}
    </Modal>
  );
}
