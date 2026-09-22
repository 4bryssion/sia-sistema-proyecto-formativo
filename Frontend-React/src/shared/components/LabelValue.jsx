// Par etiqueta/valor: la unidad de lectura de los modales de consulta.
//
// (p49) Se llamaba MaterialField y vivía en shared/components/materials/. Subió
// un nivel y cambió de nombre porque dejó de ser de materiales: el resumen del
// modal de crear préstamo lee exactamente igual. El nombre anterior habría
// obligado al módulo de préstamos a importar algo llamado "MaterialField".
//
// El formateo de precios NO vive aquí sino en shared/utils/formatMoney.js: un
// archivo de componente que exporta además una función rompe el fast refresh de
// Vite (regla react-refresh/only-export-components).
export default function LabelValue({ label, value, className = "" }) {
    return (
        <div className={`min-w-0 ${className}`}>
            <p className="font-secondary text-small text-text-muted">{label}</p>
            <p className="font-secondary text-body wrap-break-word">{value || "—"}</p>
        </div>
    );
}
