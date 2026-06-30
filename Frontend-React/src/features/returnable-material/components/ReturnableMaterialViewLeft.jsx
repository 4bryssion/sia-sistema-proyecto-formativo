import { useEffect, useState } from "react";
import returnableMaterialService from "../services/returnableMaterialService";

const IMG_BASE = "http://localhost:5000";

export default function ReturnableMaterialViewLeft({ id, refreshKey = 0 }) {
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    if (!id) return;
    returnableMaterialService.getById(id).then(setMaterial).catch(() => {});
  }, [id, refreshKey]);

  const cm = material?.consumableMaterial;

  return (
    <div className="font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      <div className="grid items-center justify-center 1400:content-between gap-4">
        {cm?.image ? (
          <img
            src={`${IMG_BASE}${cm.image}`}
            alt={cm.materialName}
            className="w-32 h-32 object-cover rounded"
          />
        ) : (
          <div className="w-32 h-32 bg-white/20 rounded flex items-center justify-center">
            <span className="text-xs text-white/60">Sin imagen</span>
          </div>
        )}
        <h3 className="text-h3 text-center">@{cm?.materialName ?? "—"}</h3>
      </div>

      <div className="grid text-center">
        <h4>Categoría:</h4>
        <p>{material?.category?.categoryName ?? "—"}</p>
      </div>

      <div className="grid text-center">
        <h4>Serial:</h4>
        <p>{material?.serial ?? "—"}</p>
      </div>

      <div className="grid text-center">
        <h4>Registro:</h4>
        <p>{cm ? (cm.isActive ? "Activo" : "Inactivo") : "—"}</p>
      </div>
    </div>
  );
}
