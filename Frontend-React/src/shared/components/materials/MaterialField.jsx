// Par etiqueta/valor: la unidad de lectura de los modales de consulta de
// material. Estaba definido igual en los dos.
//
// El formateo de precios NO vive aquí sino en shared/utils/formatMoney.js: un
// archivo de componente que exporta además una función rompe el fast refresh de
// Vite (regla react-refresh/only-export-components).
export default function MaterialField({ label, value, className = "" }) {
    return (
        <div className={`min-w-0 ${className}`}>
            <p className="font-secondary text-small text-text-muted">{label}</p>
            <p className="font-secondary text-body wrap-break-word">{value || "—"}</p>
        </div>
    );
}
