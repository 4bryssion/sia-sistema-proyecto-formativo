// Visualizar material de consumo — modal (reemplaza a /view/consumable-materials/:id).
//
// Misma estructura y segmentación que ViewUserModal: columna de identidad a la
// izquierda (imagen ampliable, nombre, estado) y rejilla de label + texto a la
// derecha. La información NO va en inputs deshabilitados: un input bloqueado
// comunica "esto se podría editar pero no puedes", que no es el mensaje de una
// pantalla de consulta. Sin logo del SENA.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Modal, Button, IconButton, usePermissions } from "@/shared";
import { Pencil, X } from "lucide-react";
import consumableMaterialService from "../services/consumableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";
import { formatDateOnly } from "@/shared/utils/formatDate";

const API_FILES = "http://localhost:5000";

const money = (v) =>
  v == null || v === "" ? "—" : `$ ${Number(v).toLocaleString("es-CO")}`;

// Par etiqueta/valor: la unidad de lectura de todo el modal
function Field({ label, value, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="font-secondary text-small text-text-muted">{label}</p>
      <p className="font-secondary text-body wrap-break-word">{value || "—"}</p>
    </div>
  );
}

export default function ViewConsumableMaterialModal({ isOpen, materialId, onClose, onEdit }) {
  const { can } = usePermissions();

  const [material, setMaterial] = useState(null);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(false);

  // Los setState van dentro de la función asíncrona y no en el cuerpo del
  // efecto: llamarlos de forma síncrona ahí encadena un render extra
  useEffect(() => {
    if (!isOpen || !materialId) return;
    (async () => {
      setError(null);
      try { setMaterial(await consumableMaterialService.getById(materialId)); }
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

  // quantity null ⇒ material serializado (tiene placa SENA). Es la misma
  // semántica que usan préstamos y retornos.
  const isSerialized = loaded && material.quantity == null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Material de consumo"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            {can("edit_consumable_material") && loaded && (
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
              {/* Exactamente el mismo marcado que ViewUserModal: mismo tamaño,
                  mismo borde y mismo object-contain, para que los modales de
                  consulta del proyecto se vean idénticos entre módulos */}
              <button
                type="button"
                onClick={() => setZoom(true)}
                aria-label="Ampliar imagen"
                className="rounded-xl overflow-hidden border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
              >
                <img
                  src={`${API_FILES}${material.image ?? ""}`}
                  alt={material.materialName}
                  className="w-32 h-32 object-contain"
                />
              </button>

              {/* Jerarquía: el nombre es el dato protagonista del modal */}
              <h3 className="font-main text-h3 font-bold text-center leading-tight">
                {material.materialName}
              </h3>

              <div className="flex flex-wrap justify-center gap-2">
                <span className="font-secondary text-small px-3 py-1 rounded-full bg-(--color-cuaternario-200)">
                  {getStatusLabel(material.status)}
                </span>

                <span
                  className={`font-secondary text-small px-3 py-1 rounded-full ${
                    material.isActive
                      ? "bg-(--color-primary-100) text-(--color-primary-950)"
                      : "bg-gray-800 text-text-primary"
                  }`}
                >
                  {material.isActive ? "Registro activo" : "Registro inactivo"}
                </span>
              </div>
            </div>

            {/* Columna de datos, agrupada por bloques: sin agrupar, doce pares
                etiqueta/valor seguidos se leen como una lista plana sin jerarquía */}
            <div className="grid gap-5">
              <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                  Identificación
                </p>
                <Field label="Marca" value={material.brand?.brandName} />
                <Field label="Placa SENA" value={material.senaPlate} />
                <Field
                  label="Cuentadante"
                  value={
                    material.user
                      ? `${material.user.userFirstName} ${material.user.userLastName}`
                      : null
                  }
                />
                <Field label="Ubicación" value={material.location} />
              </section>

              <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2 border-t border-border pt-4">
                <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                  Inventario y costos
                </p>
                <Field
                  label="Cantidad"
                  value={isSerialized ? "1 (material serializado)" : String(material.quantity)}
                />
                <Field label="Fecha de compra" value={formatDateOnly(material.purchaseDate)} />
                <Field label="Valor unitario" value={money(material.unitPrice)} />
                <Field label="Valor total" value={money(material.totalPrice)} />
              </section>

              <section className="border-t border-border pt-4">
                <Field label="Descripción" value={material.description} />
              </section>
            </div>
          </div>
        )}
      </Modal>

      {/* Visor de la imagen ampliada, en su PROPIO portal a document.body: en el
          árbol de la página quedaría dentro de otro contexto de apilamiento y el
          z-index no lo subiría por encima del modal (que sí está en portal) */}
      {zoom && loaded && createPortal(
        <div
          className="fixed inset-0 z-110 flex items-center justify-center bg-black/80 p-6 cursor-zoom-out"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen de ${material.materialName}`}
        >
          <div className="absolute top-4 right-4">
            <IconButton ariaLabel="Cerrar imagen" variant="onColor" onClick={() => setZoom(false)}>
              <X strokeWidth={2.5} />
            </IconButton>
          </div>
          {/* Caja de tamaño definido y la imagen al 100% dentro: con solo
              `max-h/max-w` una imagen pequeña se quedaba en su tamaño original y
              la "ampliación" no ampliaba nada.
              Medidas al 70% de las iniciales (900px/85vh): a tamaño completo la
              imagen ocupaba casi toda la pantalla. */}
          <div
            className="w-[min(63vw,630px)] h-[60vh] grid place-items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${API_FILES}${material.image ?? ""}`}
              alt={material.materialName}
              className="w-full h-full object-contain rounded-xl cursor-default"
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
