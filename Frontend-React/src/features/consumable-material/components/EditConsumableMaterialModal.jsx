// Editar material de consumo — modal (reemplaza a /view/consumable-materials/:id/edit).
//
// Misma estructura que EditUserModal: columna de imagen a la izquierda y rejilla
// de campos a la derecha. Al ser un formulario NO se cierra con clic fuera —se
// perdería lo escrito—: solo con Cancelar o con la X, que va por fuera del modal
// en una esquina. La imagen nueva se previsualiza dentro de la misma caja del
// file input, que sigue siendo pulsable para cambiarla las veces que haga falta.

import { useEffect, useState } from "react";
import { Modal, Input, Select, TextArea, Button, FileInput, Alert } from "@/shared";
import { Save } from "lucide-react";
import consumableMaterialService from "../services/consumableMaterialService";
import brandService from "@/features/brands/services/brandService";
import userService from "@/features/users/services/userService";
import { consumableMaterialUpdateSchema } from "../schemas/consumableMaterialSchema";
import { STATUS_FILTER_OPTIONS } from "../utils/statusLabel";

const API_FILES = "http://localhost:5000";

export default function EditConsumableMaterialModal({ isOpen, materialId, onClose, onSaved }) {
  const [material, setMaterial]         = useState(null);
  const [brandOptions, setBrandOptions] = useState([]);
  const [userOptions, setUserOptions]   = useState([]);
  const [form, setForm]                 = useState(null);
  const [image, setImage]               = useState([]);
  const [errors, setErrors]             = useState({});
  const [saving, setSaving]             = useState(false);
  const [loadError, setLoadError]       = useState(null);

  useEffect(() => {
    if (!isOpen || !materialId) return;

    (async () => {
      // Estado limpio en cada apertura: si no, al abrir un segundo material se
      // verían por un instante los datos del anterior
      setForm(null);
      setImage([]);
      setErrors({});
      setLoadError(null);
      try {
        const m = await consumableMaterialService.getById(materialId);
        setMaterial(m);
        setForm({
          materialName: m.materialName ?? "",
          brandId:      String(m.brandId ?? ""),
          senaPlate:    m.senaPlate ?? "",
          location:     m.location ?? "",
          // Con placa SENA (serializado, quantity null en BD) se muestra 1 fijo
          quantity:     m.quantity != null ? String(m.quantity) : (m.senaPlate ? "1" : ""),
          status:       m.status ?? "",
          unitPrice:    String(m.unitPrice ?? ""),
          totalPrice:   String(m.totalPrice ?? ""),
          purchaseDate: m.purchaseDate ? m.purchaseDate.slice(0, 10) : "",
          userId:       String(m.userId ?? ""),
          description:  m.description ?? "",
        });
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el material");
      }
    })();

    brandService.getAll()
      .then((brands) => setBrandOptions(brands.map((b) => ({ value: String(b.id), label: b.brandName }))))
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

    setErrors({});
    setSaving(true);

    const fd = new FormData();
    Object.entries(result.data).forEach(([key, val]) => {
      // Con placa SENA la cantidad NO se envía (el "1" del input es solo visual)
      if (key === "quantity" && result.data.senaPlate) return;
      if (val !== undefined && val !== "") fd.append(key, val);
    });
    if (image.length) fd.append("image", image[0]);

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
      setErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar material de consumo"
      // xl y 3 columnas desde 1400: con 2 columnas el formulario necesitaba 6
      // filas y sacaba scroll a 811px de alto, y en 1400 el scroll está prohibido
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
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[220px_1fr]">

          {/* Imagen. La actual se mantiene visible aunque se elija otra, para
              poder comparar y descartar la nueva sin perder la referencia. */}
          <div className="flex flex-col items-center gap-4 lg:border-r lg:border-border lg:pr-6">
            <p className="font-main text-body font-bold text-text-primary text-center">
              {material?.materialName}
            </p>

            {material?.image && (
              <div className="flex flex-col items-center gap-1">
                <span className="font-secondary text-caption text-text-muted">Imagen actual</span>
                {/* Exactamente el mismo marcado que EditUserModal, para que los
                    modales de edición se vean idénticos entre módulos */}
                <img
                  src={`${API_FILES}${material.image}`}
                  alt={material.materialName}
                  className="w-24 h-24 object-contain rounded-xl border border-border"
                />
              </div>
            )}

            <FileInput
              accept="image/*"
              multiple={false}
              label="Cambiar imagen"
              replaceLabel="Reemplazar imagen"
              previewPosition="inline"
              value={image}
              onChange={setImage}
            />
          </div>

          {/* Campos. 3 columnas desde 1400 para bajar de 6 filas a 4 y que el
              modal quepa sin scroll en pantallas de 811px de alto */}
          <div className="grid gap-4 sm:grid-cols-2 1400:grid-cols-3 justify-items-center sm:justify-items-stretch">
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
            <Input
              label="Placa SENA (opcional)"
              name="senaPlate"
              value={form.senaPlate}
              onChange={handleChange}
              error={errors.senaPlate}
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
              label="Ubicación"
              name="location"
              required
              value={form.location}
              onChange={handleChange}
              error={errors.location}
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

            <TextArea
              className="sm:col-span-2 1400:col-span-3"
              widthClass="w-full"
              label="Descripción"
              name="description"
              required
              value={form.description}
              onChange={handleChange}
              error={errors.description}
            />

            {errors.form && (
              <p className="text-error text-caption sm:col-span-2 1400:col-span-3">{errors.form}</p>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
