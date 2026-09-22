import { useState, useEffect } from "react";
import { FileText, Coins } from "lucide-react";
import { IconButton } from "../IconButton";
import ImageZoom from "../ImageZoom";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "../DropdownContext";
import { getStatusLabel } from "@/shared/utils/materialStatusLabel";
import { API_FILES, FILE_SLOTS } from "@/shared/utils/materialFiles";

// Columna de identidad de los modales de CONSULTA de material (los dos tipos):
// galería de imágenes con visor ampliado, nombre, estado y acceso a las fichas
// técnicas.
//
// (p48) Se extrajo aquí porque el material de consumo pasó a tener lo mismo que
// el devolutivo —hasta 3 imágenes y hasta 3 fichas—, así que los dos modales
// mostraban exactamente esta columna. Antes el de consumo enseñaba una sola
// imagen y ninguna ficha.
//
// El visor ampliado va en su PROPIO portal a document.body: en el árbol de la
// página quedaría dentro de otro contexto de apilamiento y el z-index no lo
// subiría por encima del modal (que sí está en portal).

export default function MaterialIdentityPanel({
    images = [],
    sheets = [],
    // (p50) Cotizaciones que respaldan el precio. Se muestran igual que la ficha
    // técnica —mismo botón, misma lista desplegable cuando hay varias— porque son
    // lo mismo desde el punto de vista de quien consulta: documentos del material
    // que se abren para leerlos. Lo único que cambia es el icono, para poder
    // distinguirlas de un vistazo.
    quotations = [],
    name,
    status,
    isActive,
}) {
    // Imagen mostrada en grande. La tira de miniaturas elige cuál.
    const [activeImage, setActiveImage] = useState(0);
    const [zoom, setZoom] = useState(false);

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

    // La imagen visible puede quedar fuera de rango si se abre otro material con
    // menos imágenes; se acota en el render en vez de sincronizarlo con un efecto
    const indice = Math.min(activeImage, Math.max(images.length - 1, 0));
    const actual = images[indice];

    const openSheet = (sheet) => window.open(`${API_FILES}${sheet.fileUrl}`, "_blank");
    const openQuotation = (q) => window.open(`${API_FILES}${q.fileUrl}`, "_blank");

    return (
        <>
            <div className="flex flex-col items-center gap-3 lg:border-r lg:border-border lg:pr-6">
                {/* Mismo marcado que los demás modales de consulta del proyecto:
                    mismo tamaño, mismo borde y mismo object-contain */}
                <button
                    type="button"
                    onClick={() => images.length && setZoom(true)}
                    aria-label="Ampliar imagen"
                    disabled={!images.length}
                    className="rounded-xl overflow-hidden border border-border cursor-zoom-in hover:opacity-90 transition-opacity disabled:cursor-default"
                >
                    {actual ? (
                        <img
                            src={`${API_FILES}${actual.imageUrl}`}
                            alt={name}
                            className="w-32 h-32 object-contain"
                        />
                    ) : (
                        <div className="w-32 h-32 grid place-items-center bg-gray-950">
                            <span className="font-secondary text-caption text-text-muted">Sin imagen</span>
                        </div>
                    )}
                </button>

                {/* Tira de miniaturas: los huecos de las 3 quedan dibujados aunque
                    el material tenga menos, para que la columna no cambie de alto */}
                <div className="flex items-center gap-2">
                    {Array.from({ length: FILE_SLOTS }).map((_, i) => (
                        images[i] ? (
                            <button
                                key={images[i].id ?? i}
                                type="button"
                                onClick={() => setActiveImage(i)}
                                aria-label={`Ver imagen ${i + 1}`}
                                className={`w-12 h-12 rounded-lg overflow-hidden border transition-colors ${
                                    indice === i ? "border-focus-border" : "border-border hover:border-focus-border"
                                }`}
                            >
                                <img src={`${API_FILES}${images[i].imageUrl}`} alt="" className="w-full h-full object-contain" />
                            </button>
                        ) : (
                            <div
                                key={`hueco-${i}`}
                                aria-hidden="true"
                                className="w-12 h-12 rounded-lg border border-dashed border-border/70"
                            />
                        )
                    ))}
                </div>

                {/* Jerarquía: el nombre es el dato protagonista del modal */}
                <h3 className="font-main text-h3 font-bold text-center leading-tight">
                    {name}
                </h3>

                <div className="flex flex-wrap justify-center gap-2">
                    <span className="font-secondary text-small px-3 py-1 rounded-full bg-(--color-cuaternario-200)">
                        {getStatusLabel(status)}
                    </span>

                    <span
                        className={`font-secondary text-small px-3 py-1 rounded-full ${
                            isActive
                                ? "bg-(--color-primary-100) text-(--color-primary-950)"
                                : "bg-gray-800 text-text-primary"
                        }`}
                    >
                        {isActive ? "Registro activo" : "Registro inactivo"}
                    </span>
                </div>

                {/* Ficha técnica: con una sola se abre directo; con varias hace
                    falta elegir, así que el mismo botón despliega la lista con el
                    nombre completo y su extensión */}
                <div className="flex items-center gap-2">
                    {sheets.length > 1 ? (
                        <Dropdown>
                            <DropdownTrigger>
                                <IconButton ariaLabel="Ver fichas técnicas" hitSize={40} iconSize={20}>
                                    <FileText />
                                </IconButton>
                            </DropdownTrigger>
                            <DropdownContent className="w-64">
                                {sheets.map((sheet) => (
                                    <DropdownItem key={sheet.id} onClick={() => openSheet(sheet)}>
                                        <span className="font-secondary text-small wrap-break-word">
                                            {sheet.fileName}
                                        </span>
                                    </DropdownItem>
                                ))}
                            </DropdownContent>
                        </Dropdown>
                    ) : (
                        <IconButton
                            ariaLabel="Ver ficha técnica"
                            hitSize={40}
                            iconSize={20}
                            disabled={!sheets.length}
                            onClick={() => sheets[0] && openSheet(sheets[0])}
                            className="disabled:opacity-40"
                        >
                            <FileText />
                        </IconButton>
                    )}
                    <span className="font-secondary text-small text-text-muted">
                        {sheets.length > 1
                            ? `Fichas técnicas (${sheets.length})`
                            : sheets.length === 1
                                ? "Ficha técnica"
                                : "Sin ficha técnica"}
                    </span>
                </div>

                {/* (p50) Cotizaciones: idéntico a la ficha técnica en estructura
                    y comportamiento. El icono de monedas apiladas es lo único que
                    las distingue — con el mismo icono de documento no se sabría
                    cuál de los dos botones abre qué. */}
                <div className="flex items-center gap-2">
                    {quotations.length > 1 ? (
                        <Dropdown>
                            <DropdownTrigger>
                                <IconButton ariaLabel="Ver cotizaciones" hitSize={40} iconSize={20}>
                                    <Coins />
                                </IconButton>
                            </DropdownTrigger>
                            <DropdownContent className="w-64">
                                {quotations.map((q) => (
                                    <DropdownItem key={q.id} onClick={() => openQuotation(q)}>
                                        <span className="font-secondary text-small wrap-break-word">
                                            {q.fileName}
                                        </span>
                                    </DropdownItem>
                                ))}
                            </DropdownContent>
                        </Dropdown>
                    ) : (
                        <IconButton
                            ariaLabel="Ver cotización"
                            hitSize={40}
                            iconSize={20}
                            disabled={!quotations.length}
                            onClick={() => quotations[0] && openQuotation(quotations[0])}
                            className="disabled:opacity-40"
                        >
                            <Coins />
                        </IconButton>
                    )}
                    <span className="font-secondary text-small text-text-muted">
                        {quotations.length > 1
                            ? `Cotizaciones (${quotations.length})`
                            : quotations.length === 1
                                ? "Cotización"
                                : "Sin cotización"}
                    </span>
                </div>
            </div>

            {/* (p50) Visor compartido: ver ImageZoom. Estaba escrito igual aquí,
                en ver usuario y en ver préstamo. */}
            {actual && (
            <ImageZoom
                isOpen={zoom}
                onClose={() => setZoom(false)}
                label={`Imagen de ${name}`}
            >
                <img
                    src={`${API_FILES}${actual?.imageUrl}`}
                    alt={name}
                    className="w-full h-full object-contain rounded-xl cursor-default"
                />
            </ImageZoom>
            )}
        </>
    );
}
