import { Modal, Button, Input, TextArea } from "@/shared";
import { formatAuditDate } from "@/shared/utils/formatDate";
import { getSeverityLabel, getModuleLabel } from "../utils/notificationLabels";

// Detalle de una notificación. Trabaja sobre la fila que ya tiene el listado:
// no pide nada al servidor, por eso no hay estado de carga ni de error.
//
// (p50) Usa el Modal compartido en vez del overlay a mano que tenía antes, y ya
// no muestra "Estado": `is_active` se eliminó de la tabla porque nunca dejó de
// ser true para ningún registro.
export default function ViewNotificationModal({ isOpen, onClose, notification }) {
  if (!notification) return null;

  const responsable = notification.user
    ? `${notification.user.userFirstName} ${notification.user.userLastName}`
    : "Sistema";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de la notificación"
      size="md"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Título" value={notification.title} readOnly />
        <Input label="Criticidad" value={getSeverityLabel(notification.severity)} readOnly />
        <Input label="Módulo" value={getModuleLabel(notification.module)} readOnly />
        <Input label="Responsable" value={responsable} readOnly />
        {/* Formato de auditoría del proyecto: HH:MM, DD/MM/AAAA */}
        <Input label="Fecha y hora" value={formatAuditDate(notification.created_at)} readOnly />
      </div>

      <div className="mt-4">
        <TextArea
          label="Descripción"
          value={notification.description}
          readOnly
          className="md:max-w-full"
        />
      </div>
    </Modal>
  );
}
