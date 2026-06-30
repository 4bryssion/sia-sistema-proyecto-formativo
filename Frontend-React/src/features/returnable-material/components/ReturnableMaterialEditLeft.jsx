import { FileInput } from "@/shared";

const IMG_BASE = "http://localhost:5000";

export default function ReturnableMaterialEditLeft({ material, image, onImageChange }) {
  const cm = material?.consumableMaterial;

  return (
    <div className="font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      <div className="grid items-center justify-center gap-3 1400:content-between">
        {cm?.image && (
          <img
            src={`${IMG_BASE}${cm.image}`}
            alt={cm.materialName}
            className="w-32 h-32 object-cover rounded mx-auto"
          />
        )}
        <div className="justify-self-center">
          <FileInput
            className="w-24 h-24"
            accept="image/jpeg,image/png,image/jpg"
            multiple={false}
            value={image}
            onChange={onImageChange}
          >
            Cambiar imagen
          </FileInput>
        </div>
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
