import { useState } from "react";
import { Button, FileInput, Alert, Modal } from "@/shared";
import quotationService from "@/shared/services/quotationService";
import { puedeCalcularHuella, huellasDeArchivos } from "@/shared/utils/fileHash";
import {
  MAX_POR_CARGA,
  QUOTATION_ACCEPT,
  QUOTATION_PREVIEW_SLOTS,
} from "@/shared/utils/quotationFiles";

// (p50) Modal de carga de cotizaciones.
//
// Vive en shared porque lo abren DOS sitios: el módulo de cotizaciones y el
// "Cargar y asignar nueva/s cotización/es" de los formularios de material. El
// módulo de materiales no puede depender del de cotizaciones, igual que pasa con
// marca, inventario y categoría.
//
// `maxFiles` es una prop y no una constante porque los dos sitios tienen topes
// distintos por una razón de fondo: desde el módulo se están dando de ALTA
// documentos (hasta 6), y desde un material se están cargando para ASIGNARLOS en
// el acto (hasta 3, que es lo que un material admite). Ofrecer 6 ahí invitaría a
// cargar archivos que no se van a poder asignar.
//
// onSave recibe las cotizaciones creadas, para que quien las cargó pueda
// autoseleccionarlas sin recargar la lista.
export default function UploadQuotationsModal({
  isOpen,
  onClose,
  onSave,
  maxFiles = MAX_POR_CARGA,
}) {
  // El cuerpo solo se monta con el modal abierto: cada apertura arranca vacía sin
  // un useEffect que haga setState.
  if (!isOpen) return null;

  return <UploadQuotationsBody onClose={onClose} onSave={onSave} maxFiles={maxFiles} />;
}

function UploadQuotationsBody({ onClose, onSave, maxFiles }) {
  const [archivos, setArchivos] = useState([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  /**
   * (p50) Comprobación de repetidos ANTES de subir nada.
   *
   * Se compara por CONTENIDO y no por nombre: el nombre no detecta el mismo PDF
   * renombrado —que es justo como se cuelan los duplicados— y se queja de dos
   * documentos distintos llamados los dos `cotizacion.pdf`.
   *
   * Va antes de la subida a propósito: enterarse de que no hacía falta subir
   * nada después de esperar a que suban 60MB no sirve de mucho.
   *
   * @returns {Promise<File[]|null>} qué archivos subir, o null para no subir nada
   */
  const resolverRepetidos = async (seleccionados) => {
    // Sin `crypto.subtle` —entrando por la IP del equipo desde otro dispositivo,
    // que no es contexto seguro— se salta la comprobación y se sube. El backend
    // calcula la huella igual, así que las cargas siguientes sí se comparan.
    if (!puedeCalcularHuella()) return seleccionados;

    let huellas;
    try {
      huellas = await huellasDeArchivos(seleccionados);
    } catch {
      // Un fallo leyendo los archivos aquí no puede impedir la carga.
      return seleccionados;
    }

    // Repetidos DENTRO de la misma selección: el mismo archivo elegido dos
    // veces. Se descartan sin preguntar, porque no hay decisión que tomar.
    const vistas = new Set();
    const unicos = [];
    const huellasUnicas = [];
    let repetidosEnLaSeleccion = 0;
    seleccionados.forEach((archivo, i) => {
      if (vistas.has(huellas[i])) { repetidosEnLaSeleccion += 1; return; }
      vistas.add(huellas[i]);
      unicos.push(archivo);
      huellasUnicas.push(huellas[i]);
    });

    let yaCargadas = {};
    try {
      yaCargadas = await quotationService.buscarDuplicados(huellasUnicas);
    } catch {
      // Si la comprobación falla, se sigue: es una ayuda, no un requisito.
      return unicos;
    }

    const repetidos = huellasUnicas
      .map((h, i) => ({ archivo: unicos[i], existente: yaCargadas[h] }))
      .filter((x) => x.existente);

    if (repetidos.length === 0) {
      if (repetidosEnLaSeleccion) {
        Alert.error(
          "Archivos repetidos en la selección",
          `Elegiste ${repetidosEnLaSeleccion} archivo(s) dos veces. Se carga uno solo de cada.`,
        );
      }
      return unicos;
    }

    const lista = repetidos
      .map((r) => `«${r.archivo.name}» ya está cargado como «${r.existente.fileName}»`)
      .join('. ');

    const { isConfirmed, isDenied } = await Alert.elegir(
      repetidos.length === 1 ? "Esta cotización ya está cargada" : "Algunas ya están cargadas",
      `${lista}. Es el mismo archivo, aunque el nombre sea distinto.`,
      {
        confirmText: repetidos.length === unicos.length ? "No cargar nada" : "Cargar solo las nuevas",
        denyText: "Cargar igual como copias",
      },
    );

    // Confirmar = quedarse con lo que ya existe y subir solo lo que no está.
    if (isConfirmed) {
      const nuevos = unicos.filter((a) => !repetidos.some((r) => r.archivo === a));
      return nuevos.length ? nuevos : null;
    }
    // Denegar = subirlo igual, a sabiendas: otra versión firmada del mismo
    // documento es un caso legítimo.
    if (isDenied) return unicos;
    // Cancelar.
    return null;
  };

  const handleSave = async () => {
    if (!archivos.length) {
      setError("Selecciona al menos un archivo PDF.");
      return;
    }

    setGuardando(true);
    Alert.loading("Revisando los archivos...");
    const aCargar = await resolverRepetidos(archivos);
    Alert.close();

    if (!aCargar) {
      setGuardando(false);
      onClose?.();
      return;
    }

    const fd = new FormData();
    // Repetir el mismo nombre de campo es como un FormData manda varios archivos
    // al mismo `array('quotation')` de multer.
    aCargar.forEach((f) => fd.append("quotation", f));

    try {
      Alert.loading(aCargar.length === 1 ? "Cargando cotización..." : "Cargando cotizaciones...");
      const res = await quotationService.upload(fd);
      Alert.close();

      const creadas = res?.data ?? [];
      onSave?.(creadas);
      onClose?.();
      Alert.success(res?.mensaje ?? "Cotizaciones cargadas");
    } catch (err) {
      Alert.close();
      const msg =
        err.response?.data?.detalles?.join(" · ") ??
        err.response?.data?.error ??
        "Error al cargar las cotizaciones";
      Alert.error("Error al cargar", msg);
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={maxFiles === 1 ? "Cargar cotización" : "Cargar cotizaciones"}
      size="md"
      closeOnBackdrop={false}
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={guardando}>
            {guardando ? "Cargando..." : "Cargar"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FileInput
          accept={QUOTATION_ACCEPT}
          multiple
          maxFiles={maxFiles}
          label="Archivos de cotización"
          replaceLabel="Reemplazar cotización"
          required
          // Un solo hueco reservado y flechas para recorrer el resto: mismo
          // criterio que en los formularios de material.
          slots={QUOTATION_PREVIEW_SLOTS}
          visibleCount={QUOTATION_PREVIEW_SLOTS}
          directionClassName="flex-col-reverse sm:flex-row-reverse"
          value={archivos}
          onChange={(files) => { setArchivos(files); setError(""); }}
          error={error}
        />

        <p className="font-secondary text-caption text-text-muted">
          Hasta {maxFiles} archivo{maxFiles === 1 ? "" : "s"} PDF por carga, de 10MB como máximo cada uno.
          Cada archivo se registra como una cotización distinta, con el nombre que tenga el archivo.
          Si alguno ya está cargado —el mismo archivo, aunque se llame distinto— se avisa antes de subirlo.
        </p>
      </div>
    </Modal>
  );
}
