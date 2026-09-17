import FileInput from "../FileInput";
import {
  MAX_IMAGES,
  MAX_TECHNICAL_SHEETS,
  IMAGE_ACCEPT,
  TECHNICAL_SHEET_ACCEPT,
  FILE_SLOTS,
} from "@/shared/utils/materialFiles";

// Banda superior de archivos de los modales de EDITAR material (los dos tipos).
//
// Va arriba y a todo el ancho, no en una columna lateral como en editar usuario:
// aquí hay DOS file inputs y cada uno enseña hasta tres previsualizaciones, así
// que la tira mide ~400px y en un lateral empujaría los campos fuera del modal.
//
// Las dos tiras mezclan lo ya guardado (descriptores remotos) con lo recién
// elegido (File): arrastrar y eliminar funcionan igual sin importar el origen, y
// al guardar `buildFileOrder` traduce esa mezcla al contrato del backend.
//
// Una sola previsualización visible y flechas para recorrer el resto. Antes
// dependía de un useMediaQuery que medía el ancho para mostrar una o las tres;
// se eliminó (sesión 4) porque decidir cuánto se renderiza midiendo el ancho en
// JS es hardcodear la responsividad. Con `slots` el hueco de las tres sigue
// reservado, así que la caja no cambia de tamaño al agregar archivos.
const PREVIEW_COUNT = 1;

export default function MaterialFilesBand({
    images,
    sheets,
    onImagesChange,
    onSheetsChange,
    imageError,
    sheetError,
}) {
    return (
        // Una sola columna hasta lg: cada file input con sus tres huecos mide
        // ~408px (caja + 3 previsualizaciones + gaps) y no encoge, así que a
        // 768px dos columnas se pisaban. Recién a partir de lg hay ancho para
        // las dos. Debajo de sm ni siquiera cabe uno: ahí la tira baja a una
        // previsualización con flechas y se coloca bajo la caja.
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 border-b border-border pb-6">
            <div className="flex flex-col gap-2">
                <FileInput
                    accept={IMAGE_ACCEPT}
                    multiple
                    maxFiles={MAX_IMAGES}
                    label="Imágenes del material"
                    replaceLabel="Reemplazar imagen"
                    required
                    slots={FILE_SLOTS}
                    directionClassName="flex-col-reverse sm:flex-row-reverse"
                    visibleCount={PREVIEW_COUNT}
                    value={images}
                    onChange={onImagesChange}
                    error={imageError}
                />
                <p className="font-secondary text-caption text-text-muted">
                    Hasta {MAX_IMAGES} imágenes (JPG o PNG). Arrastra para reordenar.
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <FileInput
                    accept={TECHNICAL_SHEET_ACCEPT}
                    multiple
                    maxFiles={MAX_TECHNICAL_SHEETS}
                    label="Fichas técnicas"
                    replaceLabel="Reemplazar ficha"
                    required
                    slots={FILE_SLOTS}
                    directionClassName="flex-col-reverse sm:flex-row-reverse"
                    visibleCount={PREVIEW_COUNT}
                    value={sheets}
                    onChange={onSheetsChange}
                    error={sheetError}
                />
                <p className="font-secondary text-caption text-text-muted">
                    Hasta {MAX_TECHNICAL_SHEETS} archivos PDF o Excel. Arrastra para reordenar.
                </p>
            </div>
        </div>
    );
}
