// Visualizar material de consumo — modal (reemplaza a /view/consumable-materials/:id).
//
// Misma estructura y segmentación que ViewUserModal: columna de identidad a la
// izquierda (galería ampliable, nombre, estado, fichas) y rejilla de label +
// texto a la derecha. La información NO va en inputs deshabilitados: un input
// bloqueado comunica "esto se podría editar pero no puedes", que no es el
// mensaje de una pantalla de consulta. Sin logo del SENA.
//
// (p48) Quedó igual que el de devolutivo salvo por los campos que este tipo no
// tiene (categoría, modelo, serial, dimensiones): la columna de identidad es el
// mismo componente compartido, con galería de hasta 3 imágenes y las fichas
// técnicas que antes solo existían en devolutivo.

import { useEffect, useState } from "react";
import { Modal, Button, usePermissions } from "@/shared";
import { Pencil } from "lucide-react";
import MaterialIdentityPanel from "@/shared/components/materials/MaterialIdentityPanel";
import LabelValue from "@/shared/components/LabelValue";
import { assignedQuotations } from "@/shared/utils/quotationFiles";
import { money } from "@/shared/utils/formatMoney";
import consumableMaterialService from "@/shared/services/consumableMaterialService";
import { accountableNames } from "@/shared/utils/accountables";
import { formatDateOnly } from "@/shared/utils/formatDate";

export default function ViewConsumableMaterialModal({ isOpen, materialId, onClose, onEdit }) {
  const { can } = usePermissions();

  const [material, setMaterial] = useState(null);
  const [error, setError] = useState(null);

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

  // quantity null ⇒ material serializado (tiene placa SENA). Es la misma
  // semántica que usan préstamos y retornos.
  const isSerialized = loaded && material.quantity == null;

  return (
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

          <MaterialIdentityPanel
            images={material.images ?? []}
            quotations={assignedQuotations(material.quotations)}
            sheets={material.technicalSheets ?? []}
            name={material.materialName}
            status={material.status}
            isActive={material.isActive}
          />

          {/* Columna de datos, agrupada por bloques: sin agrupar, doce pares
              etiqueta/valor seguidos se leen como una lista plana sin jerarquía */}
          <div className="grid gap-5">
            <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                Identificación
              </p>
              <LabelValue label="Marca" value={material.brand?.brandName} />
              <LabelValue label="Inventario" value={material.inventory?.inventoryName} />
              <LabelValue label="Placa SENA" value={material.senaPlate} />
              <LabelValue label="Ubicación" value={material.location} />
              {/* Aquí SÍ caben todos los cuentadantes, uno por línea: la tabla
                  es la que tiene que resumirlos en "el primero y N más" */}
              <LabelValue
                className="sm:col-span-2"
                label={
                  (material.accountables?.length ?? 0) > 1 ? "Cuentadantes" : "Cuentadante"
                }
                value={accountableNames(material.accountables).join(" · ")}
              />
            </section>

            <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2 border-t border-border pt-4">
              <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                Inventario y costos
              </p>
              <LabelValue
                label="Cantidad"
                value={isSerialized ? "1 (material serializado)" : String(material.quantity)}
              />
              <LabelValue label="Valor unitario" value={money(material.unitPrice)} />
              <LabelValue label="Valor total" value={money(material.totalPrice)} />
              <LabelValue label="Fecha de compra" value={formatDateOnly(material.purchaseDate)} />
              {/* (p48) Fecha de ingreso al almacén */}
              <LabelValue label="Fecha de ingreso" value={formatDateOnly(material.entryDate)} />
            </section>

            <section className="border-t border-border pt-4">
              <LabelValue label="Descripción" value={material.description} />
            </section>
          </div>
        </div>
      )}
    </Modal>
  );
}
