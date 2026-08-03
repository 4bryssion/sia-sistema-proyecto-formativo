// Editar usuario — modal (reemplaza a la antigua página /view/users/:id/edit).
//
// A diferencia del modal de visualizar, aquí SÍ hay inputs y selects: es un
// formulario. Por eso no se cierra con clic fuera (se perdería lo escrito):
// solo con Cancelar o con la X, que va por fuera del modal en una esquina.
//
// La foto nueva se previsualiza en la MISMA caja del file input
// (previewPosition="inline"), así el modal no cambia de alto al elegir archivo.

import { useEffect, useState } from "react";
import { Modal, Input, Select, Button, FileInput, Alert } from "@/shared";
import { Save } from "lucide-react";
import userService from "../services/userService";
import documentTypeService from "../services/documentTypeService";
import { todayLocalISO } from "../schemas/userSchema";

const API_FILES = "http://localhost:5000";

const ACCOUNT_TYPE_OPTIONS = [
  { id: "Solidario", value: "Solidario", label: "Solidario" },
  { id: "Cuentadante", value: "Cuentadante", label: "Cuentadante" },
];

export default function EditUserModal({ isOpen, userId, onClose, onSaved }) {
  const [user, setUser] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [form, setForm] = useState(null);
  const [image, setImage] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    // Estado limpio en cada apertura: si no, al abrir un segundo usuario se
    // verían por un instante los datos del anterior
    setForm(null);
    setImage([]);
    setErrors({});
    setLoadError(null);

    (async () => {
      try {
        const u = await userService.getById(userId);
        setUser(u);
        setForm({
          userFirstName: u.userFirstName ?? "",
          userLastName: u.userLastName ?? "",
          documentTypeId: u.documentType ? String(u.documentType.id) : "",
          userDocumentNumber: u.userDocumentNumber ?? "",
          userEndDate: u.userEndDate ? u.userEndDate.slice(0, 10) : "",
          userEmail: u.userEmail ?? "",
          userEmailInstitutional: u.userEmailInstitutional ?? "",
          userPhone: u.userPhone ?? "",
          userSecondPhone: u.userSecondPhone ?? "",
          userAddress: u.userAddress ?? "",
          userAccountType: u.userAccountType ?? "",
        });
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el usuario");
      }
    })();

    documentTypeService.getAll()
      .then((dts) => setDocumentTypes(dts.map((d) => ({ id: d.id, value: String(d.id), label: d.documentName }))))
      .catch(() => setDocumentTypes([]));
  }, [isOpen, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (form.userEmailInstitutional && form.userEmailInstitutional === form.userEmail) {
      setErrors({ userEmailInstitutional: "El institucional no puede ser igual al personal" });
      return;
    }

    const fd = new FormData();
    fd.append("userFirstName", form.userFirstName);
    fd.append("userLastName", form.userLastName);
    fd.append("documentTypeId", form.documentTypeId);
    fd.append("userDocumentNumber", form.userDocumentNumber);
    fd.append("userEndDate", form.userEndDate);
    fd.append("userEmail", form.userEmail);
    fd.append("userPhone", form.userPhone);
    fd.append("userAddress", form.userAddress);
    fd.append("userAccountType", form.userAccountType);
    fd.append("userEmailInstitutional", form.userEmailInstitutional ?? "");
    fd.append("userSecondPhone", form.userSecondPhone ?? "");
    // La contraseña no se edita aquí: solo vía recuperar contraseña en el login
    if (image.length) fd.append("image", image[0]);

    setSaving(true);
    try {
      Alert.loading("Actualizando usuario...");
      await userService.update(userId, fd);
      Alert.close();
      setErrors({});
      Alert.success("Usuario actualizado");
      onSaved?.();
      onClose?.();
    } catch (err) {
      Alert.close();
      const det = err.response?.data?.detalles;
      const msg = det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al actualizar el usuario");
      Alert.error("Error al actualizar el usuario", msg);
      setErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  const fullName = `${user?.userFirstName ?? ""} ${user?.userLastName ?? ""}`.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar usuario"
      size="lg"
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
        <p className="text-text-muted font-secondary">Cargando usuario...</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[220px_1fr]">

          {/* Foto. La actual se mantiene SIEMPRE visible aunque se elija otra:
              así se pueden comparar y descartar la nueva sin haber perdido la
              referencia. La nueva se previsualiza dentro de la caja del file
              input (previewPosition="inline"), que sigue siendo pulsable para
              cambiarla las veces que haga falta antes de guardar. */}
          <div className="flex flex-col items-center gap-4 lg:border-r lg:border-border lg:pr-6">
            <p className="font-main text-body font-bold text-text-primary text-center">
              {fullName}
            </p>

            {user?.userPhoto && (
              <div className="flex flex-col items-center gap-1">
                <span className="font-secondary text-caption text-text-muted">Foto actual</span>
                <img
                  src={`${API_FILES}${user.userPhoto}`}
                  alt={fullName}
                  className="w-24 h-24 object-contain rounded-xl border border-border"
                />
              </div>
            )}

            <FileInput
              accept="image/*"
              multiple={false}
              label="Cambiar foto"
              replaceLabel="Reemplazar imagen"
              previewPosition="inline"
              value={image}
              onChange={setImage}
            />
          </div>

          {/* Campos */}
          <div className="grid gap-4 sm:grid-cols-2 justify-items-center sm:justify-items-stretch">
            <Input
              label="Nombre"
              name="userFirstName"
              required
              value={form.userFirstName}
              onChange={handleChange}
              error={errors.userFirstName}
            />
            <Input
              label="Apellido"
              name="userLastName"
              required
              value={form.userLastName}
              onChange={handleChange}
              error={errors.userLastName}
            />
            <Select
              label="Tipo de documento"
              name="documentTypeId"
              required
              options={documentTypes}
              value={form.documentTypeId}
              onChange={handleChange}
              error={errors.documentTypeId}
            />
            <Input
              label="Número de documento"
              name="userDocumentNumber"
              required
              value={form.userDocumentNumber}
              onChange={handleChange}
              error={errors.userDocumentNumber}
            />
            <Input
              label="Teléfono"
              name="userPhone"
              type="tel"
              required
              value={form.userPhone}
              onChange={handleChange}
              error={errors.userPhone}
            />
            <Input
              label="Teléfono secundario (opcional)"
              name="userSecondPhone"
              type="tel"
              value={form.userSecondPhone}
              onChange={handleChange}
              error={errors.userSecondPhone}
            />
            <Select
              label="Tipo de usuario"
              name="userAccountType"
              required
              options={ACCOUNT_TYPE_OPTIONS}
              value={form.userAccountType}
              onChange={handleChange}
              error={errors.userAccountType}
            />
            {/* min = hoy: misma regla de fechas que el resto del proyecto */}
            <Input
              label="Fecha de finalización"
              name="userEndDate"
              type="date"
              min={todayLocalISO()}
              value={form.userEndDate}
              onChange={handleChange}
              error={errors.userEndDate}
            />
            <Input
              label="Correo personal"
              name="userEmail"
              type="email"
              required
              value={form.userEmail}
              onChange={handleChange}
              error={errors.userEmail}
            />
            <Input
              label="Correo institucional (opcional)"
              name="userEmailInstitutional"
              type="email"
              value={form.userEmailInstitutional}
              onChange={handleChange}
              error={errors.userEmailInstitutional}
            />
            {/* Sin col-span: al ocupar dos columnas quedaba visiblemente más
                ancho que el resto y rompía la alineación de la cuadrícula */}
            <Input
              label="Dirección"
              name="userAddress"
              required
              value={form.userAddress}
              onChange={handleChange}
              error={errors.userAddress}
            />

            {errors.form && (
              <p className="text-error text-caption sm:col-span-2">{errors.form}</p>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
