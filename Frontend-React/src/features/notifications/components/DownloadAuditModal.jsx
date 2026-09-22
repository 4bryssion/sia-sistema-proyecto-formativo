import { useState } from "react";
import { Modal, Button, Input } from "@/shared";
import { Alert } from "@/shared/components/utils/alert.js";
// `fileStamp` ya devuelve AAAA-MM-DD en hora local, que es lo que quiere un
// <input type="date">.
import { formatAuditDate, fileStamp, isoLocal } from "@/shared/utils/formatDate";
import { generateReport } from "@/shared/reports/generateReport";
import auditService from "../services/auditService";
import { getModelLabel, getActionLabel } from "../utils/notificationLabels";

// (p50) Descarga de la auditoría del sistema en Excel. Solo la ve el grupo
// SuperAdmin (permiso `download_audit`); el backend lo vuelve a comprobar, así
// que ocultar el botón es comodidad, no seguridad.
//
// Se pide un rango de fechas porque la auditoría crece con cada escritura del
// sistema: sin rango, la primera descarga tras unos meses de uso traería la
// tabla entera.

const HEADERS = [
  "Fecha y hora",
  "Responsable",
  "Acción",
  "Módulo",
  "Registro",
  "Campos modificados",
  "Antes",
  "Después",
];

const haceUnMesISO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return isoLocal(d);
};

// JSONB llega como objeto. Se aplana a `clave: valor` por línea porque un JSON
// crudo en una celda de Excel no hay quien lo lea.
const aTexto = (valor) => {
  if (valor == null) return "";
  if (typeof valor !== "object") return String(valor);
  return Object.entries(valor)
    .map(([k, v]) => `${k}: ${v === null ? "—" : typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("\n");
};

// Qué cambió realmente. Es la columna que se mira primero: sin ella habría que
// comparar a ojo dos bloques de JSON para encontrar el campo que se tocó.
const camposModificados = ({ before, after }) => {
  if (!before || !after || typeof before !== "object" || typeof after !== "object") return "";
  return Object.keys(after)
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .join(", ");
};

const nombreDe = (actor) =>
  actor ? `${actor.userFirstName} ${actor.userLastName}` : "Sistema";

export default function DownloadAuditModal({ isOpen, onClose }) {
  const [desde, setDesde] = useState(haceUnMesISO);
  const [hasta, setHasta] = useState(fileStamp);
  const [descargando, setDescargando] = useState(false);

  const descargar = async () => {
    if (!desde || !hasta) {
      Alert.error("Faltan fechas", "Indica la fecha de inicio y la de fin.");
      return;
    }
    if (desde > hasta) {
      Alert.error("Rango inválido", "La fecha de inicio no puede ser posterior a la de fin.");
      return;
    }

    setDescargando(true);
    Alert.loading("Preparando la auditoría...");
    try {
      const { registros, total, truncado, maxFilas } = await auditService.getRange(desde, hasta);

      const rows = registros.map((r) => [
        formatAuditDate(r.created_at),
        nombreDe(r.actor),
        getActionLabel(r.action),
        getModelLabel(r.model),
        r.recordId ?? "",
        camposModificados(r),
        aTexto(r.before),
        aTexto(r.after),
      ]);

      const generado = generateReport({
        format: "excel",
        title: "Auditoría del sistema",
        fileBase: "auditoria",
        sheetName: "Auditoría",
        headers: HEADERS,
        rows,
        filters: [
          { label: "Desde", value: desde },
          { label: "Hasta", value: hasta },
          // Si se recortó hay que decirlo EN EL ARCHIVO: un Excel con 20.000
          // filas de 60.000 parece completo y no lo está.
          ...(truncado
            ? [{ label: "Aviso", value: `Se incluyen ${maxFilas} de ${total} registros. Acota el rango para obtener el resto.` }]
            : []),
        ],
      });

      Alert.close();
      if (!generado) return;

      if (truncado) {
        // Alert.error y no warning, por la misma razón que en generateReport:
        // warning abre un confirm que espera respuesta, y aquí solo hay que
        // informar de algo que ya ocurrió.
        Alert.error(
          "Auditoría parcial",
          `El rango tiene ${total} registros y el archivo incluye los ${maxFilas} más recientes. Acota las fechas para descargar el resto.`,
        );
      }
      onClose?.();
    } catch (err) {
      Alert.close();
      Alert.error(
        "No se pudo descargar la auditoría",
        err.response?.data?.error ?? "Inténtalo de nuevo en unos momentos.",
      );
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Descargar auditoría"
      size="sm"
      // Formulario: un clic fuera no debe cerrarlo
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" size="sm" className="mr-3" onClick={onClose} disabled={descargando}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={descargar} disabled={descargando}>
            {descargando ? "Descargando..." : "Descargar"}
          </Button>
        </>
      }
    >
      <p className="font-secondary text-medium text-text-secondary mb-4">
        El archivo incluye todo lo que se creó, modificó o eliminó en el sistema
        dentro del rango, con el valor anterior y el posterior de cada cambio.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Desde"
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          max={hasta || fileStamp()}
        />
        <Input
          label="Hasta"
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          min={desde}
          max={fileStamp()}
        />
      </div>
    </Modal>
  );
}
