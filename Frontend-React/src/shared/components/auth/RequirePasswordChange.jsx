import { useState, useEffect } from "react";
import ChangePasswordModal from "@/shared/components/users/ChangePasswordModal";
import { getMustChangePassword, MUST_CHANGE_EVENT } from "@/shared/services/authStorage";
import { usePermissions } from "@/shared/context/PermissionsContext.jsx";

/**
 * (p48) Bloqueo del primer inicio de sesión.
 *
 * Mientras el usuario conserve la contraseña temporal que le llegó por correo,
 * el backend responde 403 en TODO el API salvo change-password y logout. Dejarlo
 * navegar sería enseñarle pantallas que no pueden cargar nada, así que se
 * superpone el modal de cambio de contraseña.
 *
 * Va DENTRO de PermissionsProvider, no por fuera, por una razón concreta: con el
 * bloqueo activo el provider arranca con la lista de permisos vacía (su petición
 * se comió un 403), así que al desbloquear hay que pedirle que la rehaga. Sin
 * eso el dashboard quedaba en gris —tarjetas apagadas, menú vacío— hasta que el
 * usuario recargara a mano.
 *
 * Los hijos SÍ se renderizan debajo del modal: así, al terminar el cambio, la
 * pantalla que había detrás queda lista sin volver a navegar.
 *
 * El estado se sincroniza por evento y no por lectura en cada render porque el
 * flag lo puede activar el interceptor de axios en cualquier momento (ver
 * authStorage). `useState(getMustChangePassword)` lee el valor inicial en el
 * inicializador perezoso, no en un efecto, para no encadenar un render extra.
 */
export default function RequirePasswordChange({ children }) {
  const [bloqueado, setBloqueado] = useState(getMustChangePassword);
  const { reload } = usePermissions();

  useEffect(() => {
    const onFlag = (e) => setBloqueado(!!e.detail);
    window.addEventListener(MUST_CHANGE_EVENT, onFlag);
    return () => window.removeEventListener(MUST_CHANGE_EVENT, onFlag);
  }, []);

  const handleChanged = () => {
    setBloqueado(false);
    // No se espera: el modal ya se cerró y la UI se irá habilitando cuando
    // lleguen los permisos
    reload?.();
  };

  return (
    <>
      {children}
      <ChangePasswordModal
        isOpen={bloqueado}
        forced
        onChanged={handleChanged}
      />
    </>
  );
}
