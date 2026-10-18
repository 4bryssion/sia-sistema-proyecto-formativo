import { usePermissions } from "../../context/PermissionsContext.jsx";
import { Alert } from "../utils/alert.js";
import BlockedControl from "../BlockedControl.jsx";

/**
 * (p51) Control bloqueado por falta de permiso.
 *
 * Hermano de `RequirePermission`, que guarda RUTAS: si falta el permiso, echa al
 * dashboard. Esto guarda CONTROLES dentro de una pantalla a la que sí se puede
 * entrar — el botón "Generar Reporte", una card del dashboard, cualquier acción
 * suelta. El gris y la intercepción del clic los pone `BlockedControl`; aquí solo
 * vive la regla de permisos y el texto del aviso.
 *
 * Esto es una capa de interfaz, no la autorización: el backend sigue siendo
 * quien decide, con `requirePermission` en cada ruta.
 *
 * CUIDADO: el hijo directo no puede llevar `disabled` propio — ver BlockedControl.
 *
 * <PermissionGate codename="report_users" accion="generar el reporte de usuarios">
 *   <Button onClick={abrir}>Generar Reporte</Button>
 * </PermissionGate>
 */
export default function PermissionGate({ codename, accion, children, className = "" }) {
    const { can, loading } = usePermissions();

    // Mientras los permisos cargan no se bloquea nada: hacerlo pintaría en gris
    // media pantalla durante el primer instante de cada carga. El riesgo de no
    // bloquear es nulo, porque si de verdad falta el permiso la petición muere
    // en el backend.
    const permitido = loading || can(codename);

    return (
        <BlockedControl
            bloqueado={!permitido}
            avisar={() => Alert.sinPermiso(accion)}
            className={className}
        >
            {children}
        </BlockedControl>
    );
}
