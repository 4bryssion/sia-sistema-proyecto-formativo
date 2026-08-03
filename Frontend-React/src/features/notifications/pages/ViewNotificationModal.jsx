import { Button, Input, TextArea } from "@/shared";
import { getSeverityLabel, formatAuditDate } from "../utils/severityLabel";

// Detalle de una notificación: para esto basta un modal (no una página completa).
// Reutiliza Input/TextArea/Button compartidos, sin componentes propios.
export default function ViewNotificationModal({ isOpen, onClose, notification }) {
  if (!isOpen || !notification) return null;

  const responsable = notification.user
    ? `${notification.user.userFirstName} ${notification.user.userLastName}`
    : "Sistema";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white p-6 text-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-xl font-semibold">Detalle de la notificación</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Título" value={notification.title} readOnly />
          <Input label="Criticidad" value={getSeverityLabel(notification.severity)} readOnly />
          <Input label="Módulo" value={notification.module} readOnly />
          <Input label="Responsable" value={responsable} readOnly />
          {/* Formato de auditoría del proyecto: HH:MM, DD/MM/AAAA */}
          <Input label="Fecha y hora" value={formatAuditDate(notification.created_at)} readOnly />
          <Input label="Estado" value={notification.isActive ? "Activa" : "Archivada"} readOnly />
        </div>

        <div className="mt-4">
          <TextArea
            label="Descripción"
            value={notification.description}
            readOnly
            className="md:max-w-full"
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="primary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
