import { useEffect, useState } from "react";
import consumableMaterialService from "../services/consumableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";

const IMG_BASE = "http://localhost:5000";

// refreshKey: número que sube cada vez que el padre quiere forzar una recarga
export default function ConsumableMaterialViewLeft({ id, refreshKey = 0 }) {
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    if (!id) return;
    consumableMaterialService.getById(id).then(setMaterial).catch(() => {});
  }, [id, refreshKey]);   // ← refreshKey fuerza recarga cuando sube

  return (
    <div className="font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      {/* Imagen */}
      <div className="grid items-center justify-center 1400:content-between gap-4">
        {material?.image ? (
          <img
            src={`${IMG_BASE}${material.image}`}
            alt={material.materialName}
            className="w-32 h-32 object-cover rounded"
          />
        ) : (
          <div className="w-32 h-32 bg-white/20 rounded flex items-center justify-center">
            <span className="text-xs text-white/60">Sin imagen</span>
          </div>
        )}
        <h3 className="text-h3 text-center">
          @{material?.materialName ?? "—"}
        </h3>
      </div>

      {/* Marca */}
      <div className="grid text-center">
        <h4>Marca:</h4>
        <p>{material?.brand?.brandName ?? "—"}</p>
      </div>

      {/* Estado */}
      <div className="grid text-center">
        <h4>Estado:</h4>
        <p>{getStatusLabel(material?.status)}</p>
      </div>

      {/* Activo */}
      <div className="grid text-center">
        <h4>Registro:</h4>
        <p>{material ? (material.isActive ? "Activo" : "Inactivo") : "—"}</p>
      </div>
    </div>
  );
}