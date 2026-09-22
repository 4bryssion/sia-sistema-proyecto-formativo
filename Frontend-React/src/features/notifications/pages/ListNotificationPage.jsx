import { useState, useEffect } from "react";
import { DataTable, Button, FilterMenu, ListPageHeader, usePermissions } from "@/shared";
import notificationService from "@/shared/services/notificationService";
import { useNotifications } from "../hooks/useNotifications";
import { notificationColumns } from "../table/notificationColumns.jsx";
import { SEVERITY_OPTIONS, getSeverityLabel } from "../utils/notificationLabels";
import ViewNotificationModal from "./ViewNotificationModal.jsx";
import DownloadAuditModal from "../components/DownloadAuditModal.jsx";

const SEVERITY_FILTER = SEVERITY_OPTIONS.map((s) => ({ value: s, label: getSeverityLabel(s) }));

export default function ListNotificationPage() {
  const { can } = usePermissions();
  const { notifications, loading, error } = useNotifications();
  // (p50) El filtro de criticidad solo se dibuja para quien ve el panorama del
  // sistema. Para los demás la lista es de un solo tipo —"Tarea asignada",
  // siempre Informativa—, así que filtrar por criticidad o no filtrar daría
  // exactamente la misma tabla: un control que no hace nada estorba más de lo
  // que ayuda. Es el mismo permiso que decide QUÉ se lista, así que la barra y
  // el contenido no pueden desincronizarse.
  const verSistema = can("list_system_notifications");
  const [severity, setSeverity] = useState(undefined);
  const [selected, setSelected] = useState(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // (p50) Abrir esta pantalla ES haberlas visto: apaga el punto verde de la
  // campana. Se marca al entrar y no al salir porque salir puede ser cerrar la
  // pestaña, y entonces nunca se apagaría.
  //
  // Un fallo aquí no se le muestra a nadie: el punto verde seguiría encendido
  // hasta la próxima visita, que es un defecto menor comparado con interrumpir
  // la pantalla con una alerta por algo que la persona no pidió.
  useEffect(() => {
    notificationService.markSeen().catch(() => {});
  }, []);

  // El filtro se aplica sobre los datos ANTES de entregarlos a la tabla, igual
  // que en usuarios: así el buscador, la paginación y el contador trabajan sobre
  // el conjunto ya filtrado.
  const visibles = notifications.filter(
    (n) => !verSistema || !severity || n.severity === severity,
  );

  return (
    <div className="p-6">
      <ListPageHeader title="Notificaciones">
        {/* Único permiso que no está en la matriz de ningún rol: solo SuperAdmin.
            El backend lo vuelve a exigir, así que esconder el botón es comodidad
            y no seguridad. */}
        {can("download_audit") && (
          <Button variant="primary" onClick={() => setIsAuditOpen(true)}>
            Descargar auditoría
          </Button>
        )}
      </ListPageHeader>

      {loading ? (
        <p className="text-gray-600">Cargando notificaciones...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable
          data={visibles}
          columns={notificationColumns(setSelected)}
          toolbarExtra={
            verSistema ? (
              <FilterMenu
                label="Criticidad"
                value={severity}
                onChange={setSeverity}
                options={SEVERITY_FILTER}
                allLabel="Todas"
              />
            ) : null
          }
        />
      )}

      <ViewNotificationModal
        isOpen={!!selected}
        notification={selected}
        onClose={() => setSelected(null)}
      />

      <DownloadAuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
}
