import FileInput from "../FileInput";
import {
  MAX_IMAGES,
  MAX_TECHNICAL_SHEETS,
  IMAGE_ACCEPT,
  TECHNICAL_SHEET_ACCEPT,
  FORM_PREVIEW_SLOTS,
} from "@/shared/utils/materialFiles";

// Banda de archivos de los modales de material (los dos tipos), tanto al CREAR
// como al EDITAR. (p49) Antes solo la usaba editar: crear dibujaba su propia
// columna de dos FileInput con otras medidas y otros textos, así que los dos
// formularios del mismo material no se parecían. Ahora es la misma banda, y es
// el paso de archivos del modal por pasos.
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
// JS es hardcodear la responsividad. Con `slots` el hueco queda reservado desde
// el principio, así que la caja no cambia de tamaño al agregar el primer archivo.
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
        // (p49) Dos columnas ya desde sm: con un solo hueco reservado cada file
        // input mide la caja más una previsualización (~216px), no los ~408px de
        // antes, así que las dos caben mucho antes. El borde inferior se quita:
        // en el modal por pasos la banda ES el paso, no una banda sobre unos
        // campos de los que haya que separarla.
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            <div className="flex flex-col gap-2">
                <FileInput
                    accept={IMAGE_ACCEPT}
                    multiple
                    maxFiles={MAX_IMAGES}
                    label="Imágenes del material"
                    replaceLabel="Reemplazar imagen"
                    required
                    slots={FORM_PREVIEW_SLOTS}
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
                    slots={FORM_PREVIEW_SLOTS}
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
