import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";

/**
 * Select — dos variantes:
 *
 * - variant="basic" (por defecto): el <select> nativo de siempre.
 * - variant="search": listado personalizado cuya PRIMERA fila es un buscador
 *   (icono de lupa + campo "Escribe aquí para buscar"). Filtra las opciones y
 *   muestra un máximo de 5 coincidencias dentro de las mismas filas del select.
 *   Pensado para selects con mucha información (usuarios, materiales...).
 *
 * En ambas variantes la API es idéntica (name/value/onChange/options/error), así
 * que cambiar de variante es solo agregar la prop: no hay que tocar el formulario.
 * `required` pinta el asterisco de campo obligatorio junto al label.
 */

const MAX_MATCHES = 5;

export default function Select({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    className = "",
    variant = "basic",
    required = false,
    disabled = false,
    placeholder = "Seleccione una opción",
    // Mismo criterio que en Input: el ancho es una prop, no algo a sobrescribir
    // con className (dos max-width con la misma especificidad se resuelven por
    // el orden del CSS generado, no por el del atributo)
    widthClass = "w-full md:max-w-[320px]",
}){
    const isSearch = variant === "search";

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef(null);

    // Cierra el desplegable al hacer click fuera
    useEffect(() => {
        if (!isSearch) return;
        const onClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [isSearch]);

    const selectedLabel = useMemo(
        () => options.find((o) => String(o.value) === String(value))?.label ?? "",
        [options, value]
    );

    // Máximo 5 coincidencias (búsqueda insensible a mayúsculas/acentos simples)
    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = q
            ? options.filter((o) => String(o.label).toLowerCase().includes(q))
            : options;
        return list.slice(0, MAX_MATCHES);
    }, [options, query]);

    // Emite un evento con la misma forma que el <select> nativo, para que los
    // handleChange existentes (e.target.name / e.target.value) sigan funcionando
    const emit = (val) => {
        onChange?.({ target: { name, value: val } });
        setOpen(false);
        setQuery("");
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

    // ---------------- Variante básica (select nativo) ----------------
    if (!isSearch) {
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

    // ---------------- Variante con búsqueda ----------------
    return (
        <div className={`${widthClass} ${className}`} ref={containerRef}>
            {labelNode}

            <div className="relative h-11 flex items-center">
                {/* Disparador: se ve igual que el select nativo */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((prev) => !prev)}
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
                    <span className={`truncate ${selectedLabel ? "text-text-primary" : "text-text-muted"}`}>
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronDown size={16} className="shrink-0" />
                </button>

                {open && (
                    // z-30: se superpone al contenido siguiente sin desplazarlo
                    <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-md border border-border bg-white shadow-lg overflow-hidden">
                        {/* Primera fila: buscador. El textarea crece hacia abajo
                            cuando el texto es largo (no se corta la búsqueda) */}
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
                                className="w-full resize-none outline-none font-secondary text-base bg-transparent overflow-hidden"
                            />
                        </div>

                        {/* Máximo 5 coincidencias, como filas del propio select */}
                        <ul className="max-h-60 overflow-y-auto">
                            {matches.length === 0 && (
                                <li className="px-3 py-2 font-secondary text-text-muted">
                                    Sin coincidencias
                                </li>
                            )}

                            {matches.map((opt) => (
                                <li key={opt.value ?? opt.id}>
                                    <button
                                        type="button"
                                        onClick={() => emit(opt.value)}
                                        className={`
                                            w-full px-3 py-2 text-left font-secondary cursor-pointer
                                            hover:bg-neutral-100
                                            ${String(opt.value) === String(value) ? "font-semibold" : ""}
                                        `}
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {feedbackNode}
        </div>
    );
}
