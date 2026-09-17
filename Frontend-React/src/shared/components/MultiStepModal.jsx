import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import CancelButton from "./CancelButton";

/**
 * Modal por pasos — base de los modales de "crear" de cada módulo.
 *
 * Existe porque los formularios de crear pasan de ser una página a ser un modal
 * dividido en pasos: 4 como máximo en la mayoría de módulos y 5-6 en los de
 * material consumible y devolutivo, que tienen bastantes más campos.
 *
 * Qué resuelve, para que cada módulo no lo repita:
 * - El indicador de progreso y la numeración ("Paso 2 de 4").
 * - La navegación Atrás/Siguiente/Guardar y qué botón toca en cada paso.
 * - Que NO se avance con el paso actual inválido: cada paso declara su propio
 *   `validate()`, y hasta que no pase no se pasa al siguiente. Así los errores
 *   se ven donde se cometieron y no todos juntos al final.
 * - Volver al paso 1 al reabrirse, sin arrastrar el estado de la vez anterior.
 *
 * Lo que NO hace: no conoce los campos ni el schema. Cada módulo le pasa sus
 * pasos ya construidos; el contenido de cada uno es JSX normal del módulo.
 *
 * Cada paso: { titulo, contenido, validate? }
 *   - validate: () => boolean | Promise<boolean>. Devolver false frena el avance
 *     (se asume que el propio paso ya pintó sus errores de campo).
 *
 * Sigue la estructura de los modales de formulario del proyecto:
 * `closeOnBackdrop={false}` para no perder lo escrito por un clic descuidado, y
 * la X fuera de la tarjeta.
 */
export default function MultiStepModal({
    isOpen,
    onClose,
    titulo,
    pasos = [],
    onSubmit,
    size = "xl",
    // Texto del botón que cierra el flujo en el último paso
    textoGuardar = "Guardar",
    guardando = false,
}) {
    const [indice, setIndice] = useState(0);
    const [avanzando, setAvanzando] = useState(false);

    // Para volver al paso 1 al reabrirse, el PADRE pasa una `key` distinta y el
    // componente se remonta. Es la convención del proyecto para el estado inicial
    // de un modal: sincronizarlo con un useEffect obliga a un setState dentro del
    // efecto, que encadena un render extra y que el linter marca.

    if (!pasos.length) return null;

    const total = pasos.length;
    const esUltimo = indice === total - 1;
    const paso = pasos[indice];

    const siguiente = async () => {
        if (paso.validate) {
            setAvanzando(true);
            try {
                const ok = await paso.validate();
                if (!ok) return;
            } finally {
                setAvanzando(false);
            }
        }
        setIndice((i) => Math.min(i + 1, total - 1));
    };

    const atras = () => setIndice((i) => Math.max(i - 1, 0));

    const guardar = async () => {
        if (paso.validate) {
            const ok = await paso.validate();
            if (!ok) return;
        }
        await onSubmit?.();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={titulo}
            size={size}
            closeOnBackdrop={false}
            closeButtonOutside
            footer={
                <>
                    <CancelButton onClick={onClose} />
                    {indice > 0 && (
                        <Button variant="secondary" size="sm" onClick={atras} disabled={guardando}>
                            Atrás
                        </Button>
                    )}
                    {esUltimo ? (
                        <Button variant="primary" size="sm" onClick={guardar} disabled={guardando}>
                            {guardando ? "Guardando..." : textoGuardar}
                        </Button>
                    ) : (
                        <Button variant="primary" size="sm" onClick={siguiente} disabled={avanzando || guardando}>
                            Siguiente
                        </Button>
                    )}
                </>
            }
        >
            {/* Indicador de progreso. Las barras se reparten el ancho por igual
                con flex-1: así el número de pasos puede cambiar por módulo (4, 5
                o 6) sin escribir ninguna medida. */}
            <div className="mb-6">
                <div className="flex items-center gap-2" role="progressbar"
                     aria-valuenow={indice + 1} aria-valuemin={1} aria-valuemax={total}>
                    {pasos.map((p, i) => (
                        <div
                            key={p.titulo ?? i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                                i <= indice ? "bg-button-primary" : "bg-surface-muted"
                            }`}
                        />
                    ))}
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-4">
                    <h3 className="font-main text-h3 font-bold">{paso.titulo}</h3>
                    <span className="font-secondary text-caption text-text-muted shrink-0">
                        Paso {indice + 1} de {total}
                    </span>
                </div>
            </div>

            {/* Solo se renderiza el paso actual: montar todos y ocultarlos con CSS
                dispararía las peticiones de todos los selects al abrir el modal. */}
            {paso.contenido}
        </Modal>
    );
}
