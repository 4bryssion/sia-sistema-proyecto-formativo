// Visualizar material devolutivo — modal (reemplaza a /view/returnable-materials/:id).
//
// Misma estructura y segmentación que ViewUserModal y ViewConsumableMaterialModal:
// columna de identidad a la izquierda (imagen ampliable, nombre, estado) y
// rejilla de label + texto a la derecha. La información NO va en inputs
// deshabilitados: un input bloqueado comunica "esto se podría editar pero no
// puedes", que no es el mensaje de una pantalla de consulta. Sin logo del SENA.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Modal, Button, IconButton, usePermissions,
  Dropdown, DropdownTrigger, DropdownContent, DropdownItem,
} from "@/shared";
import { Pencil, X, FileText } from "lucide-react";
import returnableMaterialService from "../services/returnableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";
import { MAX_IMAGES } from "../utils/materialFiles";
import { formatDateOnly } from "@/shared/utils/formatDate";

const API_FILES = "http://localhost:5000";

const money = (v) =>
  v == null || v === "" ? "—" : `$ ${Number(v).toLocaleString("es-CO")}`;

// Huecos de la galería: hoy el material guarda UNA imagen, pero el espacio de
// las tres queda reservado para no rediseñar el modal cuando se amplíe
const IMAGE_SLOTS = 3;

// Par etiqueta/valor: la unidad de lectura de todo el modal
function Field({ label, value, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="font-secondary text-small text-text-muted">{label}</p>
      <p className="font-secondary text-body wrap-break-word">{value || "—"}</p>
    </div>
  );
}

export default function ViewReturnableMaterialModal({ isOpen, materialId, onClose, onEdit }) {
  const { can } = usePermissions();

  const [material, setMaterial] = useState(null);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(false);
  // Imagen mostrada en grande. Con una sola imagen siempre es la 0; el estado
  // existe para que la galería funcione en cuanto haya más
  const [activeImage, setActiveImage] = useState(0);

  // Los setState van dentro de la función asíncrona y no en el cuerpo del
  // efecto: llamarlos de forma síncrona ahí encadena un render extra
  useEffect(() => {
    if (!isOpen || !materialId) return;
    (async () => {
      setError(null);
      setActiveImage(0);
      try { setMaterial(await returnableMaterialService.getById(materialId)); }
      catch (err) { setError(err.response?.data?.error ?? "Error al cargar el material"); }
    })();
  }, [isOpen, materialId]);

  // Puede quedar en memoria el material de la apertura anterior: se compara el
  // id para no mostrar datos de otro registro mientras llega el pedido
  const loaded = material && String(material.id) === String(materialId);

  // Con la imagen ampliada, Escape cierra SOLO el visor (capture:true evita que
  // el listener del Modal se dispare también y cierre todo de una vez)
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setZoom(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [zoom]);

  const cm = loaded ? material.consumableMaterial : null;

  // quantity null ⇒ material serializado (tiene placa SENA). Es la misma
  // semántica que usan préstamos y retornos.
  const isSerialized = cm && cm.quantity == null;

  // La imagen sigue siendo una sola columna en BD: se normaliza a array para
  // que la galería y el visor no tengan que distinguir los dos casos
  const images = cm?.image ? [cm.image].slice(0, MAX_IMAGES) : [];
  const sheets = material?.technicalSheets ?? [];

  const openSheet = (sheet) => window.open(`${API_FILES}${sheet.fileUrl}`, "_blank");

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Material devolutivo"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            {can("edit_returnable_material") && loaded && (
              <Button variant="primary" size="sm" className="gap-2" onClick={() => onEdit?.(material.id)}>
                <Pencil size={16} />
                Editar
              </Button>
            )}
          </>
        }
      >
        {error ? (
          <p className="text-error font-secondary">{error}</p>
        ) : !loaded ? (
          <p className="text-text-muted font-secondary">Cargando material...</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">

            {/* Columna de identidad */}
            <div className="flex flex-col items-center gap-3 lg:border-r lg:border-border lg:pr-6">
              {/* Mismo marcado que los otros modales de consulta: mismo tamaño,
                  mismo borde y mismo object-contain */}
              <button
                type="button"
                onClick={() => images.length && setZoom(true)}
                aria-label="Ampliar imagen"
                disabled={!images.length}
                className="rounded-xl overflow-hidden border border-border cursor-zoom-in hover:opacity-90 transition-opacity disabled:cursor-default"
              >
                {images.length ? (
                  <img
                    src={`${API_FILES}${images[activeImage]}`}
                    alt={cm.materialName}
                    className="w-32 h-32 object-contain"
                  />
                ) : (
                  <div className="w-32 h-32 grid place-items-center bg-gray-950">
                    <span className="font-secondary text-caption text-text-muted">Sin imagen</span>
                  </div>
                )}
              </button>

              {/* Tira de miniaturas: hoy solo la primera tiene imagen, las otras
                  dos quedan como hueco reservado. Cuando el material admita 3
                  imágenes, estas ya seleccionan cuál se ve en grande. */}
              <div className="flex items-center gap-2">
                {Array.from({ length: IMAGE_SLOTS }).map((_, i) => (
                  images[i] ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`Ver imagen ${i + 1}`}
                      className={`w-12 h-12 rounded-lg overflow-hidden border transition-colors ${
                        activeImage === i ? "border-focus-border" : "border-border hover:border-focus-border"
                      }`}
                    >
                      <img src={`${API_FILES}${images[i]}`} alt="" className="w-full h-full object-contain" />
                    </button>
                  ) : (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="w-12 h-12 rounded-lg border border-dashed border-border/70"
                    />
                  )
                ))}
              </div>

              {/* Jerarquía: el nombre es el dato protagonista del modal */}
              <h3 className="font-main text-h3 font-bold text-center leading-tight">
                {cm.materialName}
              </h3>

              <div className="flex flex-wrap justify-center gap-2">
                <span className="font-secondary text-small px-3 py-1 rounded-full bg-(--color-cuaternario-200)">
                  {getStatusLabel(cm.status)}
                </span>

                <span
                  className={`font-secondary text-small px-3 py-1 rounded-full ${
                    cm.isActive
                      ? "bg-(--color-primary-100) text-(--color-primary-950)"
                      : "bg-gray-800 text-text-primary"
                  }`}
                >
                  {cm.isActive ? "Registro activo" : "Registro inactivo"}
                </span>
              </div>

              {/* Ficha técnica: con una sola se abre directo; con varias hace
                  falta elegir, así que el mismo botón despliega la lista con el
                  nombre completo y su extensión */}
              <div className="flex items-center gap-2">
                {sheets.length > 1 ? (
                  <Dropdown>
                    <DropdownTrigger>
                      <IconButton ariaLabel="Ver fichas técnicas" hitSize={40} iconSize={20}>
                        <FileText />
                      </IconButton>
                    </DropdownTrigger>
                    <DropdownContent className="w-64">
                      {sheets.map((sheet) => (
                        <DropdownItem key={sheet.id} onClick={() => openSheet(sheet)}>
                          <span className="font-secondary text-small wrap-break-word">
                            {sheet.fileName}
                          </span>
                        </DropdownItem>
                      ))}
                    </DropdownContent>
                  </Dropdown>
                ) : (
                  <IconButton
                    ariaLabel="Ver ficha técnica"
                    hitSize={40}
                    iconSize={20}
                    disabled={!sheets.length}
                    onClick={() => sheets[0] && openSheet(sheets[0])}
                    className="disabled:opacity-40"
                  >
                    <FileText />
                  </IconButton>
                )}
                <span className="font-secondary text-small text-text-muted">
                  {sheets.length > 1
                    ? `Fichas técnicas (${sheets.length})`
                    : sheets.length === 1
                      ? "Ficha técnica"
                      : "Sin ficha técnica"}
                </span>
              </div>
            </div>

            {/* Columna de datos, agrupada por bloques: sin agrupar, quince pares
                etiqueta/valor seguidos se leen como una lista plana sin jerarquía */}
            <div className="grid gap-5">
              <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                  Identificación
                </p>
                <Field label="Marca" value={cm.brand?.brandName} />
                <Field label="Categoría" value={material.category?.categoryName} />
                <Field label="Modelo" value={material.model} />
                <Field label="Serial" value={material.serial} />
                <Field label="Placa SENA" value={cm.senaPlate} />
                <Field
                  label="Cuentadante"
                  value={cm.user ? `${cm.user.userFirstName} ${cm.user.userLastName}` : null}
                />
                <Field label="Ubicación" value={cm.location} />
                {/* Dimensiones solo la pide "Muebles y enseres": en el resto de
                    categorías es NULL y mostrar el par vacío solo añade ruido */}
                {material.dimensions && (
                  <Field label="Dimensiones" value={material.dimensions} />
                )}
              </section>

              <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2 border-t border-border pt-4">
                <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                  Inventario y costos
                </p>
                <Field
                  label="Cantidad"
                  value={isSerialized ? "1 (material serializado)" : String(cm.quantity)}
                />
                <Field label="Fecha de compra" value={formatDateOnly(cm.purchaseDate)} />
                <Field label="Valor unitario" value={money(cm.unitPrice)} />
                <Field label="Valor total" value={money(cm.totalPrice)} />
              </section>

              <section className="border-t border-border pt-4">
                <Field label="Descripción" value={cm.description} />
              </section>
            </div>
          </div>
        )}
      </Modal>

      {/* Visor de la imagen ampliada, en su PROPIO portal a document.body: en el
          árbol de la página quedaría dentro de otro contexto de apilamiento y el
          z-index no lo subiría por encima del modal (que sí está en portal) */}
      {zoom && loaded && images.length > 0 && createPortal(
        <div
          className="fixed inset-0 z-110 flex items-center justify-center bg-black/80 p-6 cursor-zoom-out"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen de ${cm.materialName}`}
        >
          <div className="absolute top-4 right-4">
            <IconButton ariaLabel="Cerrar imagen" variant="onColor" onClick={() => setZoom(false)}>
              <X strokeWidth={2.5} />
            </IconButton>
          </div>
          {/* Caja de tamaño definido y la imagen al 100% dentro: con solo
              `max-h/max-w` una imagen pequeña se quedaba en su tamaño original y
              la "ampliación" no ampliaba nada */}
          <div
            className="w-[min(63vw,630px)] h-[60vh] grid place-items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${API_FILES}${images[activeImage]}`}
              alt={cm.materialName}
              className="w-full h-full object-contain rounded-xl cursor-default"
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
