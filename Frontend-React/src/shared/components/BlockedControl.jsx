/**
 * (p51) Control visible pero bloqueado, que DICE por qué al pulsarlo.
 *
 * La regla del proyecto es que lo bloqueado no desaparece: se ve en gris y
 * explica. Un control gris que al hacerle clic no hace absolutamente nada se lee
 * como que la aplicación se rompió — fue un defecto reportado, no una teoría.
 *
 * Aquí vive solo el CÓMO (el gris, el cursor, interceptar el clic). El por qué lo
 * pone quien lo usa, porque hay más de una razón para bloquear algo:
 *   - falta de permiso  → `PermissionGate`, que envuelve a este,
 *   - un rol del sistema que no se puede tocar (RFADMIN43.1 / 44.1),
 *   - y las que vengan.
 *
 * CUIDADO: el hijo directo no puede llevar `disabled` propio. Un control
 * deshabilitado no emite clic en ningún navegador, así que el aviso no saldría y
 * volvería el botón gris y mudo. Si el control se deshabilita por su cuenta,
 * envuelve el bloque que lo contiene en vez del control suelto.
 */
export default function BlockedControl({ bloqueado, avisar, children, className = "" }) {
    const interceptar = (e) => {
        e.preventDefault();
        e.stopPropagation();
        avisar();
    };

    // El contenedor se dibuja SIEMPRE, bloqueado o no. Si solo existiera en el
    // caso bloqueado, el mismo control mediría distinto según quién mire —una
    // card del dashboard con envoltura y la de al lado sin ella, en la misma
    // grilla— y la pantalla se vería torcida en vez de en gris.
    return (
        <div
            // En fase de CAPTURA: corre antes de que el evento alcance el
            // `onClick` del hijo, así que también cancela la navegación de un
            // <Link> antes de que React Router la vea.
            onClickCapture={bloqueado ? interceptar : undefined}
            onKeyDownCapture={bloqueado ? (e) => {
                if (e.key === "Enter" || e.key === " ") interceptar(e);
            } : undefined}
            aria-disabled={bloqueado ? "true" : undefined}
            // El cursor se repite para los descendientes porque el
            // `cursor-pointer` del hijo gana por especificidad sobre el del
            // contenedor.
            className={[
                bloqueado ? "opacity-50 cursor-not-allowed [&_*]:cursor-not-allowed" : "",
                className,
            ].filter(Boolean).join(" ")}
        >
            {children}
        </div>
    );
}
