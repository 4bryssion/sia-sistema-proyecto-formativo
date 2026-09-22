import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

/**
 * Select — dos variantes PRIMARIAS y una SECUNDARIA que se superpone a las dos.
 *
 * Primarias (prop `variant`):
 * - "basic" (por defecto): el <select> nativo de siempre.
 * - "search": listado propio cuya PRIMERA fila es un buscador (icono de lupa +
 *   campo "Escribe aquí para buscar"). Filtra las opciones y las muestra dentro
 *   de las mismas filas del select.
 *
 * Secundaria (prop `multiple`): selección de VARIAS opciones con casillas.
 * Se combina con cualquiera de las dos primarias:
 *   - multiple + basic  → lista con casillas, sin buscador
 *   - multiple + search → lista con casillas y buscador arriba
 * Con `multiple` el <select> nativo deja de usarse aunque la variante sea
 * "basic": un <select multiple> del navegador no dibuja casillas y se maneja con
 * Ctrl+clic, que es justo lo que se quiere evitar.
 *
 * (p50) Dos capacidades más, ambas opcionales y pensadas para el select de
 * cotizaciones, pero escritas en general porque no tienen nada de específico:
 *
 * - `maxSelected`: tope de opciones marcables. Al llegar al tope, las que NO
 *   estén marcadas se deshabilitan en vez de desaparecer — quitarlas de la lista
 *   haría creer que ya no existen, y lo que pasa es que hay que soltar una para
 *   poder tomar otra. Las marcadas siguen pulsables para poder desmarcarlas.
 *
 * - `onPreview`: si se pasa, cada fila lleva un botón propio a la derecha (un
 *   ojo, por ejemplo) que llama a `onPreview(opcion)` SIN tocar la selección.
 *   Sirve para mirar el documento antes de decidir si asignarlo.
 *   Va como hermano del botón de la fila y no dentro: un <button> dentro de otro
 *   es HTML inválido y el navegador lo reordena por su cuenta.
 *
 * La API es la misma en todos los casos (name/value/onChange/options/error), así
 * que cambiar de variante es agregar una prop: no hay que tocar el formulario.
 * En `multiple`, `value` es un ARRAY y el onChange emite un array.
 * `required` pinta el asterisco de campo obligatorio junto al label.
 */

// (p50) Cuántas filas se VEN antes de tener que desplazarse.
//
// Antes esta prop recortaba la lista: con 13 cotizaciones y un tope de 5, las
// otras 8 sencillamente no existían para quien no supiera su nombre — y si una
// de ellas ya estaba asignada, no había forma de verla ni de quitarla.
//
// Ahora el tope es de ALTURA, no de datos: se dibujan todas y la caja mide lo
// que midan `filasVisibles` filas. Quien sabe el nombre lo escribe; quien no,
// baja con la rueda.
//
// Sigue siendo una prop porque el alto disponible cambia según dónde esté el
// select: en el panel de accesos solo caben 4 filas sin que el desplegable tape
// el contenido de abajo.
const FILAS_VISIBLES_POR_DEFECTO = 5;

// Alto aproximado de una fila (py-2 + una línea de texto), en rem para que siga
// al tamaño de fuente en vez de a un número de píxeles. Si una etiqueta larga
// parte en dos líneas, la última fila asoma a medias — y eso es justo la señal
// de que hay más abajo.
const ALTO_FILA_REM = 2.5;

export default function Select({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    className = "",
    variant = "basic",
    // Variante secundaria: selección múltiple con casillas
    multiple = false,
    required = false,
    disabled = false,
    placeholder = "Seleccione una opción",
    filasVisibles = FILAS_VISIBLES_POR_DEFECTO,
    // (p50) Tope de opciones marcables (solo con `multiple`)
    maxSelected,
    // (p50) Acción por fila que NO cambia la selección: recibe la opción
    onPreview,
    // Qué icono dibuja ese botón. Se pasa como nodo para que el consumidor elija
    // el suyo sin que este componente tenga que conocerlos todos.
    previewIcon,
    previewLabel = "Ver",
    // Qué decir cuando hay varios elegidos y no caben todos en el disparador
    resumenSeleccion,
    // Mismo criterio que en Input: el ancho es una prop, no algo a sobrescribir
    // con className (dos max-width con la misma especificidad se resuelven por
    // el orden del CSS generado, no por el del atributo)
    widthClass = "w-full md:max-w-[320px]",
}){
    const isSearch = variant === "search";
    // El nativo solo sirve para selección simple: con casillas se usa siempre el
    // listado propio, venga de la variante que venga
    const usaListaPropia = isSearch || multiple;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef(null);

    // Selección múltiple: `value` puede llegar como array, como valor suelto o
    // vacío. Se normaliza a array de strings para comparar sin sorpresas de tipo.
    const seleccionados = useMemo(() => {
        if (!multiple) return [];
        const lista = Array.isArray(value) ? value : value ? [value] : [];
        return lista.map(String);
    }, [multiple, value]);

    // Cierra el desplegable al hacer click fuera
    useEffect(() => {
        if (!usaListaPropia) return;
        const onClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [usaListaPropia]);

    const selectedLabel = useMemo(
        () => options.find((o) => String(o.value) === String(value))?.label ?? "",
        [options, value]
    );

    // Texto del disparador en selección múltiple. Con uno solo se muestra su
    // nombre; con varios, el primero y cuántos más, porque la lista completa
    // desbordaría el ancho del campo.
    const resumenMultiple = useMemo(() => {
        if (!multiple || seleccionados.length === 0) return "";
        if (resumenSeleccion) return resumenSeleccion(seleccionados);
        const etiqueta = (v) => options.find((o) => String(o.value) === v)?.label ?? v;
        if (seleccionados.length === 1) return etiqueta(seleccionados[0]);
        return `${etiqueta(seleccionados[0])} y ${seleccionados.length - 1} más`;
    }, [multiple, seleccionados, options, resumenSeleccion]);

    // Coincidencias del buscador. Ya NO se recortan: la caja limita el alto y el
    // resto se alcanza desplazándose.
    //
    // (p50) En selección múltiple lo ya elegido va PRIMERO. Sin esto, con una
    // lista larga, lo que tienes asignado podía quedar tan abajo que ni sabías
    // que estaba marcado ni podías desmarcarlo. Que se reordene al marcar es
    // deliberado: deja siempre a la vista lo que llevas elegido, que es lo que
    // hay que revisar antes de guardar.
    const matches = useMemo(() => {
        const q = isSearch ? query.trim().toLowerCase() : "";
        const lista = q
            ? options.filter((o) => String(o.label).toLowerCase().includes(q))
            : options;

        if (!multiple || seleccionados.length === 0) return lista;

        const elegidas = [];
        const resto = [];
        for (const o of lista) {
            (seleccionados.includes(String(o.value ?? o.id)) ? elegidas : resto).push(o);
        }
        return [...elegidas, ...resto];
    }, [options, query, isSearch, multiple, seleccionados]);

    // Emite un evento con la misma forma que el <select> nativo, para que los
    // handleChange existentes (e.target.name / e.target.value) sigan funcionando
    const emit = (val) => {
        onChange?.({ target: { name, value: val } });
        setOpen(false);
        setQuery("");
    };

    // (p50) ¿Se llegó al tope? Con el tope alcanzado solo se puede desmarcar.
    const topeAlcanzado = multiple && maxSelected != null && seleccionados.length >= maxSelected;

    // En múltiple el desplegable NO se cierra al elegir: lo normal es marcar
    // varios seguidos, y cerrarlo obligaría a reabrirlo en cada uno.
    const toggleSeleccion = (val) => {
        const v = String(val);
        const yaEstaba = seleccionados.includes(v);
        // Se comprueba también aquí y no solo deshabilitando el botón: el tope es
        // una regla de datos, y dejarla únicamente en el atributo `disabled` la
        // volvería decorativa ante cualquier otra vía de entrada.
        if (!yaEstaba && topeAlcanzado) return;
        const siguiente = yaEstaba
            ? seleccionados.filter((x) => x !== v)
            : [...seleccionados, v];
        onChange?.({ target: { name, value: siguiente } });
    };

    const labelNode = label && (
        <label
            className={`
                block
                text-caption
                mb-1
                place-self-start
                font-secondary

                ${error ? "text-error" : "text-text-primary"}
            `}
        >
            {label}
            {/* Asterisco de obligatorio en verde primario (token --color-required) */}
                    {required && <span className="text-required font-bold ml-0.5" aria-hidden="true">*</span>}
        </label>
    );

    const feedbackNode = error && (
        <p
            className="
                text-caption
                text-error
                place-self-start
                font-secondary
            "
        >
            {error}
        </p>
    );

    // ---------------- Variante básica de selección simple (select nativo) ----------------
    if (!usaListaPropia) {
        return (
            <div className={`${widthClass} ${className}`}>
                {labelNode}

                {/* Contenedor h-11 con el campo de 48px superpuesto: iguala la
                    altura total del Input en el layout */}
                <div className="relative h-11 flex items-center">
                    {/* bg-white y text-text-primary explícitos: un <select> nativo
                        HEREDA el color de texto del contenedor pero NO el fondo.
                        Sobre superficies oscuras (el panel negro de administración
                        de permisos) heredaba texto blanco sobre su fondo blanco y
                        quedaba ilegible. */}
                    <select
                        name={name}
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        className={`
                            relative
                            w-full
                            h-12
                            border
                            border-border
                            rounded-md
                            px-4
                            font-secondary
                            bg-white
                            text-text-primary

                            hover:border-2
                            hover:border-focus-border
                            ${error ? "border-error" : "border border-border"}
                        `}
                    >
                        <option value="">{placeholder}</option>

                        {options.map((opt) => (
                            <option key={opt.value ?? opt.id} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {feedbackNode}
            </div>
        );
    }

    // ---------------- Listado propio (search y/o multiple) ----------------
    const textoDisparador = multiple ? resumenMultiple : selectedLabel;

    return (
        <div className={`${widthClass} ${className}`} ref={containerRef}>
            {labelNode}

            <div className="relative h-11 flex items-center">
                {/* Disparador: se ve igual que el select nativo */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className={`
                        relative
                        w-full
                        h-12
                        flex
                        items-center
                        justify-between
                        gap-2
                        border
                        border-border
                        rounded-md
                        px-4
                        font-secondary
                        text-left
                        bg-white
                        cursor-pointer
                        disabled:cursor-not-allowed
                        disabled:opacity-60

                        hover:border-2
                        hover:border-focus-border
                        ${error ? "border-error" : "border border-border"}
                    `}
                >
                    {/* Mismo motivo que en la variante básica: sobre superficies
                        oscuras el texto heredaría el color claro del contenedor */}
                    <span className={`truncate ${textoDisparador ? "text-text-primary" : "text-text-muted"}`}>
                        {textoDisparador || placeholder}
                    </span>
                    <ChevronDown size={16} className="shrink-0" />
                </button>

                {open && (
                    // z-30: se superpone al contenido siguiente sin desplazarlo
                    <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-md border border-border bg-white shadow-lg overflow-hidden">
                        {/* Primera fila: buscador. Solo en la variante con búsqueda.
                            El textarea crece hacia abajo cuando el texto es largo
                            (no se corta la búsqueda) */}
                        {isSearch && (
                            <div className="flex items-start gap-2 px-3 py-2 border-b border-border">
                                <Search size={16} className="mt-1 shrink-0 text-text-muted" />
                                <textarea
                                    autoFocus
                                    rows={1}
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    placeholder="Escribe aquí para buscar"
                                    className="w-full resize-none outline-none font-secondary text-body bg-transparent overflow-hidden"
                                />
                            </div>
                        )}

                        {/* Filas del propio select. Se dibujan TODAS; lo que
                            limita `filasVisibles` es cuántas se ven antes de
                            tener que desplazarse. */}
                        <ul
                            className="overflow-y-auto"
                            style={{ maxHeight: `${filasVisibles * ALTO_FILA_REM}rem` }}
                            role="listbox"
                            aria-multiselectable={multiple}
                        >
                            {matches.length === 0 && (
                                <li className="px-3 py-2 font-secondary text-text-muted">
                                    {isSearch ? "Sin coincidencias" : "Sin opciones"}
                                </li>
                            )}

                            {matches.map((opt) => {
                                const v = String(opt.value ?? opt.id);
                                const marcado = multiple
                                    ? seleccionados.includes(v)
                                    : String(opt.value) === String(value);
                                // (p50) Con el tope alcanzado, lo no marcado se
                                // deshabilita: sigue a la vista —para que se
                                // entienda que existe— pero no se puede tomar sin
                                // soltar otra antes.
                                const bloqueada = topeAlcanzado && !marcado;
                                return (
                                    <li key={opt.value ?? opt.id} className="flex items-stretch">
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={marcado}
                                            disabled={bloqueada}
                                            title={bloqueada ? `Ya tienes ${maxSelected} seleccionadas. Quita una para elegir otra.` : undefined}
                                            onClick={() => (multiple ? toggleSeleccion(opt.value) : emit(opt.value))}
                                            className={`
                                                flex-1 min-w-0 px-3 py-2 text-left font-secondary
                                                flex items-center gap-2
                                                enabled:cursor-pointer enabled:hover:bg-neutral-100
                                                disabled:cursor-not-allowed disabled:opacity-50
                                                ${marcado && !multiple ? "font-semibold" : ""}
                                            `}
                                        >
                                            {/* La casilla se dibuja a mano y no con un <input type="checkbox">:
                                                dentro de un <button> el clic llegaría dos veces (al input y al
                                                botón) y la selección se marcaría y desmarcaría sola. */}
                                            {multiple && (
                                                <span
                                                    aria-hidden="true"
                                                    className={`
                                                        flex h-4 w-4 shrink-0 items-center justify-center
                                                        rounded border
                                                        ${marcado
                                                            ? "border-button-primary bg-button-primary text-white"
                                                            : "border-border bg-white"}
                                                    `}
                                                >
                                                    {marcado && <Check size={12} strokeWidth={3} />}
                                                </span>
                                            )}
                                            <span className="truncate">{opt.label}</span>
                                        </button>

                                        {/* Acción de fila, hermana del botón de
                                            selección: mirar no es elegir, y
                                            anidar botones es HTML inválido. */}
                                        {onPreview && (
                                            <button
                                                type="button"
                                                onClick={() => onPreview(opt)}
                                                aria-label={`${previewLabel}: ${opt.label}`}
                                                title={previewLabel}
                                                className="shrink-0 px-3 cursor-pointer text-text-muted hover:bg-neutral-100 hover:text-text-primary"
                                            >
                                                {previewIcon}
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>

                        {/* En múltiple hace falta una forma explícita de cerrar: el
                            desplegable no se cierra al marcar, porque lo normal es
                            marcar varios seguidos. */}
                        {multiple && (
                            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                                <span className="font-secondary text-caption text-text-muted">
                                    {/* Con tope se muestra "2 de 3": saber cuántas
                                        caben todavía evita el intento fallido. */}
                                    {maxSelected != null
                                        ? `${seleccionados.length} de ${maxSelected} seleccionada${maxSelected === 1 ? "" : "s"}`
                                        : `${seleccionados.length} seleccionado${seleccionados.length === 1 ? "" : "s"}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); setQuery(""); }}
                                    className="font-secondary text-caption underline underline-offset-2 cursor-pointer"
                                >
                                    Listo
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {feedbackNode}
        </div>
    );
}
