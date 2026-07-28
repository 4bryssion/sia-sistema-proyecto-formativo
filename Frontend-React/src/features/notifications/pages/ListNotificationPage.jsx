import { useState } from "react";
import { DataTable, IconButton } from "@/shared";
import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { notificationColumns } from "../table/notificationColumns.jsx";
import ViewNotificationModal from "./ViewNotificationModal.jsx";

// Listado de notificaciones/logs del sistema. Solo lectura: los registros los
// genera el backend (notify()); el detalle se ve en un modal.
export default function ListNotificationPage() {
  const navigate = useNavigate();
  const { notifications, loading, error } = useNotifications();
  const [selected, setSelected] = useState(null);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">
            Notificaciones del sistema
          </h1>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando notificaciones...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable data={notifications} columns={notificationColumns(setSelected)} />
      )}

      <ViewNotificationModal
        isOpen={!!selected}
        notification={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
