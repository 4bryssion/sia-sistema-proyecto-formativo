// Visualizar material devolutivo — modal (reemplaza a /view/returnable-materials/:id).
//
// Misma estructura y segmentación que ViewUserModal: columna de identidad a la
// izquierda (galería ampliable, nombre, estado, fichas) y rejilla de label +
// texto a la derecha. La información NO va en inputs deshabilitados: un input
// bloqueado comunica "esto se podría editar pero no puedes", que no es el
// mensaje de una pantalla de consulta. Sin logo del SENA.
//
// (p48) La columna de identidad es ahora un componente compartido con el modal
// de material de consumo: los dos tipos tienen las mismas imágenes y las mismas
// fichas técnicas, así que mantener dos copias solo servía para que se
// separaran con el tiempo.

import { useEffect, useState } from "react";
import { Modal, Button, usePermissions } from "@/shared";
import { Pencil } from "lucide-react";
import MaterialIdentityPanel from "@/shared/components/materials/MaterialIdentityPanel";
import LabelValue from "@/shared/components/LabelValue";
import { assignedQuotations } from "@/shared/utils/quotationFiles";
import { money } from "@/shared/utils/formatMoney";
import returnableMaterialService from "@/shared/services/returnableMaterialService";
import { accountableNames } from "@/shared/utils/accountables";
import { formatDateOnly } from "@/shared/utils/formatDate";

export default function ViewReturnableMaterialModal({ isOpen, materialId, onClose, onEdit }) {
  const { can } = usePermissions();

  const [material, setMaterial] = useState(null);
  const [error, setError] = useState(null);

  // Los setState van dentro de la función asíncrona y no en el cuerpo del
  // efecto: llamarlos de forma síncrona ahí encadena un render extra
  useEffect(() => {
    if (!isOpen || !materialId) return;
    (async () => {
      setError(null);
      try { setMaterial(await returnableMaterialService.getById(materialId)); }
      catch (err) { setError(err.response?.data?.error ?? "Error al cargar el material"); }
    })();
  }, [isOpen, materialId]);

  // Puede quedar en memoria el material de la apertura anterior: se compara el
  // id para no mostrar datos de otro registro mientras llega el pedido
  const loaded = material && String(material.id) === String(materialId);

  // (p48) Cuentadantes, imágenes y fichas cuelgan de la tabla PADRE
  const cm = loaded ? material.consumableMaterial : null;

  // quantity null ⇒ material serializado (tiene placa SENA). Es la misma
  // semántica que usan préstamos y retornos.
  const isSerialized = cm && cm.quantity == null;

  return (
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

          <MaterialIdentityPanel
            images={cm.images ?? []}
            quotations={assignedQuotations(cm.quotations)}
            sheets={cm.technicalSheets ?? []}
            name={cm.materialName}
            status={cm.status}
            isActive={cm.isActive}
          />

          {/* Columna de datos, agrupada por bloques: sin agrupar, quince pares
              etiqueta/valor seguidos se leen como una lista plana sin jerarquía */}
          <div className="grid gap-5">
            <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                Identificación
              </p>
              <LabelValue label="Marca" value={cm.brand?.brandName} />
              <LabelValue label="Inventario" value={cm.inventory?.inventoryName} />
              <LabelValue label="Categoría" value={material.category?.categoryName} />
              <LabelValue label="Modelo" value={material.model} />
              <LabelValue label="Serial" value={material.serial} />
              <LabelValue label="Placa SENA" value={cm.senaPlate} />
              <LabelValue label="Ubicación" value={cm.location} />
              {/* Dimensiones solo la pide "Muebles y enseres": en el resto de
                  categorías es NULL y mostrar el par vacío solo añade ruido */}
              {material.dimensions && (
                <LabelValue label="Dimensiones" value={material.dimensions} />
              )}
              {/* Aquí SÍ caben todos los cuentadantes: la tabla es la que tiene
                  que resumirlos en "el primero y N más" */}
              <LabelValue
                className="sm:col-span-2"
                label={(cm.accountables?.length ?? 0) > 1 ? "Cuentadantes" : "Cuentadante"}
                value={accountableNames(cm.accountables).join(" · ")}
              />
            </section>

            <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2 border-t border-border pt-4">
              <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                Inventario y costos
              </p>
              <LabelValue
                label="Cantidad"
                value={isSerialized ? "1 (material serializado)" : String(cm.quantity)}
              />
              <LabelValue label="Valor unitario" value={money(cm.unitPrice)} />
              <LabelValue label="Valor total" value={money(cm.totalPrice)} />
              <LabelValue label="Fecha de compra" value={formatDateOnly(cm.purchaseDate)} />
              {/* (p48) Fecha de ingreso al almacén */}
              <LabelValue label="Fecha de ingreso" value={formatDateOnly(cm.entryDate)} />
            </section>

            <section className="border-t border-border pt-4">
              <LabelValue label="Descripción" value={cm.description} />
            </section>
          </div>
        </div>
      )}
    </Modal>
  );
}
