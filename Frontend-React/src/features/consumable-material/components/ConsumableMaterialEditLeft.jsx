import { FileInput } from "@/shared";
import { getStatusLabel } from "../utils/statusLabel";

const IMG_BASE = "http://localhost:5000";

export default function ConsumableMaterialEditLeft({ material, image, onImageChange }) {
  return (
    <div className="font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      <div className="grid items-center justify-center gap-3 1400:content-between">
        {material?.image && (
          <img
            src={`${IMG_BASE}${material.image}`}
            alt={material.materialName}
            className="w-32 h-32 object-cover rounded mx-auto"
          />
        )}

        <div className="justify-self-center">
          <FileInput
            className="w-24 h-24"
            accept="image/*"
            multiple={false}
            value={image}
            onChange={onImageChange}
          >
            Cambiar imagen
          </FileInput>
        </div>

        <h3 className="text-h3 text-center">
          @{material?.materialName ?? "—"}
        </h3>
      </div>

      <div className="grid text-center">
        <h4>Marca:</h4>
        <p>{material?.brand?.brandName ?? "—"}</p>
      </div>

      <div className="grid text-center">
        <h4>Estado:</h4>
        <p>{getStatusLabel(material?.status)}</p>
      </div>

      <div className="grid text-center">
        <h4>Registro:</h4>
        <p>{material ? (material.isActive ? "Activo" : "Inactivo") : "—"}</p>
      </div>
    </div>
  );
}
