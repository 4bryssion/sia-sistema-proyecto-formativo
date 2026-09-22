import { useState } from "react";
import { Modal, Input, Button, Alert } from "@/shared";
import { KeyRound } from "lucide-react";
import { changePassword } from "@/shared/services/authService";
import { changePasswordSchema } from "@/shared/schemas/changePasswordSchema";
import { clearMustChangePassword } from "@/shared/services/authStorage";
import { logout } from "@/shared/services/logoutService";

// Cambiar contraseña con la sesión iniciada. Un solo componente para los DOS
// casos, porque el endpoint y el formulario son los mismos:
//
// - Voluntario ("Mi perfil → Cambiar contraseña"): se puede cancelar.
// - Obligatorio (primer inicio de sesión): `forced`. Sin Cancelar, sin X y sin
//   cierre con clic fuera ni con Escape — hasta cambiarla, el backend responde
//   403 en todo el API, así que dejarlo cerrar solo daría una pantalla muerta.
//
// El cuerpo va en un componente aparte que solo se monta cuando está abierto:
// así cada apertura arranca con los campos vacíos sin un useEffect que haga
// setState (regla react-hooks/set-state-in-effect).
export default function ChangePasswordModal({ isOpen, onClose, onChanged, forced = false }) {
  if (!isOpen) return null;

  return <ChangePasswordBody onClose={onClose} onChanged={onChanged} forced={forced} />;
}

function ChangePasswordBody({ onClose, onChanged, forced }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // El modal forzado tapa el navbar entero (va en un portal sobre todo), así que
  // sin este botón el usuario que no tenga a mano su contraseña temporal se
  // queda encerrado: ni cambia ni sale, y al cerrar la pestaña su sesión sigue
  // ocupada en el servidor y el siguiente intento de entrar responde 409.
  // El backend deja abiertas exactamente DOS salidas de este estado
  // (change-password y logout); esta es la segunda.
  const handleLogout = async () => {
    const result = await Alert.confirm(
      "¿Cerrar sesión?",
      "Podrás volver a entrar con tu contraseña temporal cuando la tengas a mano.",
    );
    if (!result.isConfirmed) return;
    await logout();
    window.location.href = "/auth";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const result = changePasswordSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0]] = issue.message; });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      Alert.loading("Cambiando contraseña...");
      await changePassword({
        currentPassword: result.data.currentPassword,
        newPassword: result.data.newPassword,
      });
      Alert.close();
      await Alert.success(
        "Contraseña actualizada",
        "Te enviamos un correo de confirmación. Tu sesión sigue abierta.",
      );
      // El flag se limpia DESPUÉS de la alerta: limpiarlo antes desmonta este
      // mismo componente (RequirePasswordChange deja de renderizarlo) mientras
      // todavía está esperando el await, y la confirmación se veía sin modal
      // detrás. El backend ya lo limpió en BD; esto es solo la copia de sesión.
      clearMustChangePassword();
      onChanged?.();
      onClose?.();
    } catch (err) {
      Alert.close();

      // El 401 tiene dos significados y el servicio ya los separó. La sesión
      // caducada no se puede arreglar escribiendo de nuevo la contraseña: hay
      // que salir. Y como esta llamada no pasa por el interceptor de axios,
      // nadie más va a cerrarla.
      if (err.sessionExpired) {
        await Alert.error("Tu sesión terminó", err.message);
        await logout();
        window.location.href = "/auth";
        return;
      }

      Alert.error(
        err.status === 401 ? "Contraseña actual incorrecta" : "No se pudo cambiar la contraseña",
        err.message,
      );
      if (err.status === 401) setErrors({ currentPassword: "Contraseña incorrecta" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={forced ? undefined : onClose}
      title={forced ? "Cambia tu contraseña temporal" : "Cambiar contraseña"}
      size="sm"
      closeOnBackdrop={false}
      // La X va fuera de la tarjeta, en la esquina: es la regla del proyecto
      // para los modales de formulario (dentro le restaba espacio al contenido).
      closeButtonOutside
      showCloseButton={false}
      footer={
        <>
          {forced ? (
            <Button variant="secondary" size="sm" onClick={handleLogout} disabled={saving}>
              Cerrar sesión
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
          )}
          <Button variant="primary" size="sm" className="gap-2" onClick={handleSubmit} disabled={saving}>
            <KeyRound size={16} />
            {saving ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        {forced && (
          <p className="font-secondary text-body text-text-primary">
            Entraste con la contraseña temporal que te llegó por correo. Para poder
            usar el sistema, elige una contraseña nueva. Si no la tienes a mano,
            cierra sesión y vuelve cuando la encuentres.
          </p>
        )}

        <Input
          label="Contraseña actual"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          placeholder={forced ? "La que te llegó por correo" : "Tu contraseña de ahora"}
          value={form.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
        />

        <Input
          label="Nueva contraseña"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={form.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
        />

        <Input
          label="Repite la nueva contraseña"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <p className="font-secondary text-caption text-text-muted">
          Debe tener al menos 8 caracteres, con una mayúscula, una minúscula, un
          número y un carácter especial.
        </p>
      </form>
    </Modal>
  );
}
