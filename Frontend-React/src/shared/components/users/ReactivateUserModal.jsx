import { useState } from "react";
import { Modal, Input, Button, Alert } from "@/shared";
import { RotateCcw } from "lucide-react";
import userService from "@/shared/services/userService";
import { todayLocalISO } from "@/shared/schemas/userSchema";

/**
 * (p48) Reactivar un usuario exige fechas nuevas.
 *
 * No es un capricho de la interfaz: el backend rechaza el toggle de activación
 * sin `userStartDate` y `userEndDate`. La vigencia anterior ya se agotó —o se
 * adelantó a hoy al desactivarlo—, así que reactivar sin fechas dejaría una
 * cuenta activa que el login rechazaría de inmediato por vencida.
 *
 * El cuerpo va en un componente aparte que solo se monta cuando está abierto:
 * así cada apertura arranca con la fecha de inicio en hoy sin un useEffect que
 * haga setState (regla react-hooks/set-state-in-effect).
 */
export default function ReactivateUserModal({ isOpen, user, onClose, onReactivated }) {
  if (!isOpen || !user) return null;

  return <ReactivateBody user={user} onClose={onClose} onReactivated={onReactivated} />;
}

function ReactivateBody({ user, onClose, onReactivated }) {
  // La fecha inicial se calcula UNA vez (es solo el valor por defecto del
  // campo), pero las comparaciones de abajo vuelven a pedir el día actual: un
  // modal abierto a través de la medianoche validaría contra ayer y el backend
  // respondería 400 por una fecha que en pantalla parece correcta.
  const [form, setForm] = useState(() => ({ userStartDate: todayLocalISO(), userEndDate: "" }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const nombre = `${user.userFirstName ?? ""} ${user.userLastName ?? ""}`.trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Las mismas tres reglas que aplica el backend, adelantadas para señalar el
    // campo en vez de devolver un mensaje suelto
    const hoy = todayLocalISO();
    const nuevos = {};
    if (!form.userStartDate) nuevos.userStartDate = "La fecha de inicio es obligatoria";
    if (!form.userEndDate)   nuevos.userEndDate   = "La fecha de finalización es obligatoria";
    if (form.userStartDate && form.userEndDate && form.userEndDate < form.userStartDate) {
      nuevos.userEndDate = "No puede ser anterior a la fecha de inicio";
    }
    if (form.userEndDate && form.userEndDate < hoy) {
      nuevos.userEndDate = "No puede ser anterior a hoy: el usuario no podría entrar";
    }
    if (Object.keys(nuevos).length) {
      setErrors(nuevos);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      Alert.loading("Reactivando usuario...");
      await userService.toggle(user.id, form);
      Alert.close();
      Alert.success(
        "Usuario reactivado",
        `${nombre} puede volver a entrar. Le enviamos un correo con su nueva vigencia.`,
      );
      onReactivated?.();
      onClose?.();
    } catch (err) {
      Alert.close();
      const det = err.response?.data?.detalles;
      Alert.error(
        "No se pudo reactivar el usuario",
        det?.length ? det.join(" · ") : (err.response?.data?.error ?? ""),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Reactivar usuario"
      size="sm"
      closeOnBackdrop={false}
      // La X va fuera de la tarjeta, en la esquina: es la regla del proyecto
      // para los modales de formulario (dentro le restaba espacio al contenido).
      closeButtonOutside
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" className="gap-2" onClick={handleSubmit} disabled={saving}>
            <RotateCcw size={16} />
            {saving ? "Reactivando..." : "Reactivar"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <p className="font-secondary text-body text-text-primary">
          {nombre} volverá a tener acceso. Indica la nueva vigencia de su vínculo:
          la anterior ya se agotó, y sin fechas nuevas el sistema lo rechazaría
          al intentar entrar.
        </p>

        <Input
          label="Fecha de inicio"
          name="userStartDate"
          type="date"
          required
          value={form.userStartDate}
          onChange={handleChange}
          error={errors.userStartDate}
        />

        <Input
          label="Fecha de finalización"
          name="userEndDate"
          type="date"
          required
          min={form.userStartDate || undefined}
          value={form.userEndDate}
          onChange={handleChange}
          error={errors.userEndDate}
        />
      </form>
    </Modal>
  );
}
