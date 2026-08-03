// Input controlado: soporta imágenes + PDF + Excel, preview condicional, reorder y limpieza de memoria
//
// Contrato visual del proyecto (jul-2026):
// - La caja del trigger mide SIEMPRE 96x96 (no se estira al ancho del contenedor):
//   así el componente ocupa un tamaño predecible y la responsividad de los
//   formularios no depende de dónde se coloque.
// - El texto NO va dentro de la caja: va como `label` externo (mismo patrón que
//   Input/Select/TextArea) y admite `required` para el asterisco obligatorio.
// - La dirección de las previsualizaciones se controla con `previewPosition`
//   (top | bottom | left | right). Cambiar la dirección por breakpoint permite
//   resolver la responsividad desde el consumidor sin tocar este componente.
// - `previewPosition="inline"` dibuja la previsualización DENTRO de la caja
//   (modales de edición). La caja no desaparece: sigue siendo el disparador, así
//   que se puede reemplazar el archivo cuantas veces haga falta antes de guardar.
// - `visibleCount` limita CUÁNTAS previsualizaciones se ven a la vez y saca
//   flechas para recorrer las demás. Es una decisión de responsividad que CSS no
//   puede tomar: ocultar las sobrantes no basta, porque las flechas necesitan
//   saber cuántas caben para calcular el desplazamiento. El consumidor lo
//   calcula por breakpoint con `useMediaQuery`.
// - `slots` reserva el hueco de N previsualizaciones aunque todavía no haya
//   tantos archivos, para que la caja no salte de tamaño al ir cargándolos.

import { useRef, useState, useEffect, useMemo } from "react";
import { Infinity as InfinityLoader } from "ldrs/react";
import "ldrs/react/Infinity.css";
import { ImageUp, FileUp, X, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "./IconButton";

// Tamaño único de caja y de cada previsualización (96px = w-24/h-24)
const BOX = "w-24 h-24";

// Dirección del contenedor según dónde deben aparecer las previsualizaciones.
//
// OJO con el orden del DOM: las previsualizaciones se pintan ANTES que la caja.
// Por eso `flex-row` deja las previsualizaciones a la IZQUIERDA y hace falta
// `-reverse` para ponerlas a la derecha o abajo. El nombre de la prop describe
// dónde queda la PREVISUALIZACIÓN respecto de la caja.
const DIRECTION = {
    left:   "flex-row",
    right:  "flex-row-reverse",
    top:    "flex-col",
    bottom: "flex-col-reverse",
    inline: "flex-row",
};

// Un elemento de `value` puede ser un File recién elegido o un archivo YA
// guardado en el servidor, descrito como { id, url, name, type }. En los
// modales de edición conviven los dos en la misma tira: el usuario no debería
// notar cuál está subido y cuál no para poder reordenarlos o quitarlos.
const isRemote = (file) => !!file && !(file instanceof File);

const isImage = (file) => file?.type?.startsWith("image/");

const isExcel = (file) =>
    /sheet|excel|csv/i.test(file?.type ?? "") || /\.(xlsx|xls|csv)$/i.test(file?.name ?? "");

const isPdf = (file) =>
    file?.type === "application/pdf" || /\.pdf$/i.test(file?.name ?? "");

export default function FileInput({
    value = [],            // Estado externo (File[])
    onChange,              // Setter externo
    multiple = false,      // Modo selección
    maxFiles,              // Límite explícito; por defecto 1 (simple) o 12 (múltiple)
    accept = "image/*,application/pdf",
    label,                 // Texto externo, estilo label de Input
    required = false,      // Asterisco de campo obligatorio
    previewPosition = "right",
    // Cuántas previsualizaciones se ven a la vez; el resto se alcanza con las
    // flechas. undefined = se ven todas (comportamiento anterior).
    visibleCount,
    // Huecos reservados en la tira de previsualizaciones. Sirve para que el
    // formulario ocupe desde el principio el espacio que ocupará lleno.
    slots,
    // Escape hatch para responsividad: cuando la dirección debe cambiar por
    // breakpoint (ej. "flex-col sm:flex-row-reverse 1400:flex-col") el consumidor
    // pasa las clases aquí y estas reemplazan a `previewPosition`.
    directionClassName,
    replaceLabel,          // Texto alternativo cuando el límite es 1 y ya hay archivo
    error,
    className = "",
    children,              // Compatibilidad: si no hay `label`, se usa como label
}){
    const inputRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    // Primera previsualización visible cuando no caben todas
    const [offset, setOffset] = useState(0);

    const limit = maxFiles ?? (multiple ? 12 : 1);

    // Solo se aceptan imágenes cuando el accept no menciona otros tipos:
    // decide qué icono de carga mostrar (imagen vs archivo genérico)
    const onlyImages = /^image\//.test(accept) && !/pdf|sheet|excel|csv/i.test(accept);
    const UploadIcon = onlyImages ? ImageUp : FileUp;

    // ObjectURL para TODO archivo previsualizable (imagen y PDF).
    // El Excel no lo necesita: se dibuja una tarjeta con el nombre.
    const previews = useMemo(
        () => value.map((file) => {
            if (isExcel(file)) return null;        // el Excel se dibuja como tarjeta
            if (isRemote(file)) return file.url;   // ya lo sirve el backend
            return URL.createObjectURL(file);
        }),
        [value],
    );

    // Limpieza de ObjectURL (prevención memory leak).
    // Solo se revocan los que se crearon aquí: revocar la URL de un archivo
    // remoto rompería su previsualización sin ganar nada.
    useEffect(() => {
        return () => {
            value.forEach((file, i) => {
                if (!isRemote(file) && previews[i]) URL.revokeObjectURL(previews[i]);
            });
        };
    }, [previews, value]);

    // Normaliza FileList, simula async (loader) y respeta el límite
    const handleFiles = async (files) => {
        setIsLoading(true);

        const list = Array.from(files);
        await new Promise((r) => setTimeout(r, 400));

        const data = multiple ? [...value, ...list] : [list[0]];
        onChange(data.slice(0, limit));

        setIsLoading(false);
    };

    // Eliminación inmutable
    const remove = (i) => {
        const copy = [...value];
        copy.splice(i, 1);
        onChange(copy);
    };

    // Reordenamiento por drag & drop
    const reorder = (from, to) => {
        if (from == null || from === to) return;
        const copy = [...value];
        const [m] = copy.splice(from, 1);
        copy.splice(to, 0, m);
        onChange(copy);
    };

    const isFull = value.length >= limit;

    // Ventana de previsualizaciones visibles.
    //
    // Sin `visibleCount` se ven todas, pero el ancho de la tira nunca baja de
    // `slots`: así el formulario ocupa desde vacío el mismo espacio que lleno y
    // no da un salto al cargar el primer archivo.
    const perView = visibleCount ?? Math.max(value.length, slots ?? 0);
    const maxOffset = Math.max(0, value.length - perView);
    const canNavigate = value.length > perView;

    // Quitar un archivo puede dejar la ventana más allá del final. Se corrige al
    // LEER y no con un efecto que reajuste el estado: un setState dentro de un
    // efecto encadena un render extra para llegar al mismo sitio.
    const safeOffset = Math.min(offset, maxOffset);

    // Se conserva el índice REAL: remove y reorder trabajan sobre `value`, no
    // sobre la porción visible
    const visibleFiles = value
        .map((file, index) => ({ file, index }))
        .slice(safeOffset, safeOffset + perView);

    const emptyBoxes = Math.max(0, Math.min(slots ?? 0, perView) - visibleFiles.length);

    // Con límite 1 y archivo cargado, la acción ya no es "cargar" sino "reemplazar"
    const baseLabel = label ?? children;
    const replaceText = replaceLabel ?? (onlyImages ? "Reemplazar imagen" : "Reemplazar archivo");
    const shownLabel = limit === 1 && value.length === 1 ? replaceText : baseLabel;

    // inline: la previsualización se dibuja DENTRO de la caja, no al lado.
    // La caja nunca desaparece: sigue siendo el disparador, así que se puede
    // reemplazar el archivo tantas veces como haga falta antes de guardar.
    const inline = previewPosition === "inline";
    const inlineFile = inline ? value[0] : null;

    return (
        <div className={`w-max ${className}`}>

            {/* items-end: como el label ocupa alto encima de la caja, alinear por el
                borde inferior deja las previsualizaciones a ras de la caja en las
                direcciones horizontales.
                En las verticales `items-end` alinearía a la DERECHA. Antes daba
                igual porque todos los hijos medían 96px; con las flechas la tira
                pasa a medir ~160px y la caja quedaba pegada a su borde derecho.
                Lo corrige el `mx-auto` de cada hijo: en columna centra en x, y en
                fila no hace nada porque este contenedor es `w-max` y no sobra
                espacio en el eje principal que un margen automático pueda absorber. */}
            <div className={`flex ${directionClassName ?? DIRECTION[previewPosition] ?? DIRECTION.right} items-end gap-2 w-max`}>

                {/* Tira de previsualizaciones (con sus flechas si no caben todas).
                    Va envuelta en un contenedor propio para que `directionClassName`
                    ordene BLOQUE vs caja: si las previsualizaciones fueran hijas
                    sueltas, las flechas se colocarían entre ellas.
                    En modo inline no se dibuja: la previsualización va dentro de la caja. */}
                {!inline && (visibleFiles.length > 0 || emptyBoxes > 0) && (
                <div className="flex items-center gap-1 shrink-0 mx-auto">

                    {canNavigate && (
                        <IconButton
                            ariaLabel="Ver archivo anterior"
                            hitSize={28}
                            iconSize={16}
                            disabled={safeOffset === 0}
                            onClick={() => setOffset(Math.max(0, safeOffset - 1))}
                            className="disabled:opacity-30"
                        >
                            <ChevronLeft strokeWidth={2.5} />
                        </IconButton>
                    )}

                    <div className="flex items-end gap-2">
                {visibleFiles.map(({ file, index: i }) => (
                    <div
                        key={`${file.name}-${i}`}
                        draggable={multiple}
                        onDragStart={() => setDragIndex(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => reorder(dragIndex, i)}
                        className={`relative ${BOX} shrink-0 rounded-xl border border-gray-200 overflow-hidden group bg-white`}
                    >
                        {isImage(file) && (
                            // object-contain: la imagen se compacta y se ve COMPLETA
                            // (con object-cover se recortaba)
                            <img
                                src={previews[i]}
                                alt={file.name}
                                className="w-full h-full object-contain"
                            />
                        )}

                        {isPdf(file) && (
                            // Primera página del PDF con el visor nativo del navegador:
                            // view=FitH ajusta al ancho (compacta en x) y recorta en y.
                            // pointer-events-none evita que el visor capture el drag/click.
                            <embed
                                src={`${previews[i]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                type="application/pdf"
                                className="w-full h-full pointer-events-none"
                            />
                        )}

                        {isExcel(file) && (
                            // Excel no se puede renderizar: tarjeta con fondo cuaternario
                            // claro y el nombre en negro (mayor contraste sobre ese cian)
                            <div className="w-full h-full flex items-center justify-center bg-(--color-cuaternario-300) p-1">
                                <span className="text-caption font-secondary text-black text-center break-all line-clamp-4">
                                    {file.name}
                                </span>
                            </div>
                        )}

                        {/* Acciones hover: reorder (solo múltiple) + eliminar */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {multiple && (
                                <span className="w-6 h-6 grid place-items-center bg-white/90 rounded-full text-black cursor-grab">
                                    <ArrowLeftRight size={12} />
                                </span>
                            )}
                            <button
                                type="button"
                                aria-label={`Quitar ${file.name}`}
                                className="w-6 h-6 grid place-items-center bg-white/90 rounded-full text-black cursor-pointer hover:bg-white"
                                onClick={() => remove(i)}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                ))}

                        {/* Huecos reservados: mantienen el ancho de la tira
                            aunque falten archivos por cargar */}
                        {Array.from({ length: emptyBoxes }).map((_, i) => (
                            <div
                                key={`slot-${i}`}
                                aria-hidden="true"
                                className={`${BOX} shrink-0 rounded-xl border-2 border-dashed border-gray-200/70`}
                            />
                        ))}
                    </div>

                    {canNavigate && (
                        <IconButton
                            ariaLabel="Ver archivo siguiente"
                            hitSize={28}
                            iconSize={16}
                            disabled={safeOffset >= maxOffset}
                            onClick={() => setOffset(Math.min(maxOffset, safeOffset + 1))}
                            className="disabled:opacity-30"
                        >
                            <ChevronRight strokeWidth={2.5} />
                        </IconButton>
                    )}
                </div>
                )}

                {/* Trigger: label + caja fija de 96x96, sin texto dentro.
                    El label viaja JUNTO a la caja (no arriba de todo el componente)
                    para que "Reemplazar imagen" siempre quede sobre el file input y
                    no sobre la previsualización, sea cual sea `previewPosition` */}
                <div className="flex flex-col shrink-0 mx-auto">

                    {/* w-24 (el ancho de la caja): el bloque label+caja mide lo
                        mismo que una previsualización, así el conjunto queda
                        alineado sea cual sea la dirección */}
                    {shownLabel && (
                        <label
                            className={`
                                block
                                text-caption
                                mb-1
                                font-secondary
                                cursor-pointer
                                leading-tight
                                w-24

                                ${error ? "text-error" : "text-text-primary"}
                            `}
                            onClick={() => !isLoading && inputRef.current?.click()}
                        >
                            {shownLabel}
                            {/* Asterisco de obligatorio en verde primario (token --color-required) */}
                            {required && <span className="text-required font-bold ml-0.5" aria-hidden="true">*</span>}
                        </label>
                    )}

                    <div
                        role="button"
                        tabIndex={0}
                        aria-label={shownLabel ?? "Cargar archivo"}
                        onClick={() => !isLoading && inputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                        }}
                        className={`
                            relative group
                            ${BOX} shrink-0
                            rounded-2xl
                            flex items-center justify-center
                            cursor-pointer
                            transition-colors
                            overflow-hidden
                            hover:border-focus-border
                            ${inlineFile
                                // Con archivo dentro, el borde pasa a continuo:
                                // ya no es una zona vacía a la espera de contenido
                                ? "border-2 border-solid border-gray-200 bg-white"
                                : "border-2 border-dashed border-gray-200 hover:bg-gray-950"}
                            ${isFull && limit > 1 && !inline ? "opacity-50 pointer-events-none" : ""}
                        `}
                    >
                        {isLoading ? (
                            <InfinityLoader
                                size="48"
                                stroke="4"
                                strokeLength="0.15"
                                bgOpacity="0.1"
                                speed="1.3"
                                color="black"
                            />
                        ) : inlineFile ? (
                            <>
                                {isImage(inlineFile) && (
                                    <img src={previews[0]} alt={inlineFile.name} className="w-full h-full object-contain" />
                                )}
                                {isPdf(inlineFile) && (
                                    <embed
                                        src={`${previews[0]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                        type="application/pdf"
                                        className="w-full h-full pointer-events-none"
                                    />
                                )}
                                {isExcel(inlineFile) && (
                                    <div className="w-full h-full flex items-center justify-center bg-(--color-cuaternario-300) p-1">
                                        <span className="text-caption font-secondary text-black text-center break-all line-clamp-4">
                                            {inlineFile.name}
                                        </span>
                                    </div>
                                )}

                                {/* Velo al pasar el cursor: recuerda que la caja
                                    SIGUE siendo el disparador y se puede reemplazar
                                    el archivo cuantas veces haga falta */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UploadIcon size={28} strokeWidth={1.75} className="text-white" />
                                </div>

                                {/* Descartar y volver a la foto actual */}
                                <button
                                    type="button"
                                    aria-label={`Quitar ${inlineFile.name}`}
                                    className="absolute top-1 right-1 w-6 h-6 grid place-items-center bg-white/90 rounded-full text-black cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    onClick={(e) => { e.stopPropagation(); remove(0); }}
                                >
                                    <X size={12} />
                                </button>
                            </>
                        ) : (
                            <UploadIcon size={32} strokeWidth={1.75} className="text-gray-200" />
                        )}
                    </div>
                </div>
            </div>

            {/* Feedback message — misma forma que Input/TextArea */}
            {error && (
                <p className="text-caption text-error font-secondary mt-1 max-w-55">
                    {error}
                </p>
            )}

            {/* Input desacoplado de IU */}
            <input
                ref={inputRef}
                type="file"
                hidden
                multiple={multiple}
                accept={accept}
                onChange={(e) => {
                    handleFiles(e.target.files);
                    // Permite volver a elegir el MISMO archivo tras quitarlo
                    e.target.value = "";
                }}
            />
        </div>
    );
}
