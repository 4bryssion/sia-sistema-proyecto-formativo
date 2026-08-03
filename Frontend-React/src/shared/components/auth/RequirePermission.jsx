import { Navigate } from "react-router-dom";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { Alert } from "../utils/alert.js";

/**
 * Guard de ruta por permiso (complementa a ProtectedRoute, que solo valida el token).
 * Si el usuario no tiene el codename requerido: alerta + redirección al dashboard.
 */
export default function RequirePermission({ codename, children }) {
  const { can, loading } = usePermissions();

  // Mientras cargan los permisos no se decide nada (evita expulsar por falso negativo)
  if (loading) return <p className="p-6 text-gray-600">Verificando permisos...</p>;

  if (!can(codename)) {
    Alert.error("Acceso denegado", "No tienes permisos para acceder a este módulo.");
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
