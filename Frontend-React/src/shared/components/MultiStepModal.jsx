import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

/**
 * Modal por pasos — base de los modales de "crear" y de los de editar material.
 *
 * Existe porque los formularios pasan de ser una página a ser un modal dividido
 * en pasos: 4 como máximo en la mayoría de módulos y 5-6 en material consumible
 * y devolutivo, que tienen bastantes más campos.
 *
 * Qué resuelve, para que cada módulo no lo repita:
 * - El indicador de progreso y la numeración ("Paso 2 de 4").
 * - La navegación y qué botón toca en cada paso.
 * - Que no se guarde con datos inválidos, señalando EN QUÉ PASO está el error.
 * - Volver al paso 1 al reabrirse, sin arrastrar el estado de la vez anterior.
 *
 * Lo que NO hace: no conoce los campos ni el schema. Cada módulo le pasa sus
 * pasos ya construidos; el contenido de cada uno es JSX normal del módulo.
 *
 * Cada paso: { titulo, contenido, validate? }
 *   - validate: () => boolean | Promise<boolean>. Devolver false frena (se asume
 *     que el propio paso ya pintó sus errores de campo).
 *
 * ── Los dos modos, y por qué se comportan distinto ──────────────────────────
 *
 * `modo="crear"` (por defecto): recorrido secuencial. No se puede saltar a un
 * paso que no se ha llegado a ver, y solo se guarda desde el último. Tiene
 * sentido porque al crear NO hay nada todavía: un paso puede depender de lo
 * elegido en el anterior, y ofrecer "Guardar" en el paso 1 sería ofrecer guardar
 * algo a medio hacer.
 *
 * `modo="editar"`: navegación libre y "Guardar" disponible desde cualquier paso.
 * Aquí todos los pasos vienen ya diligenciados y son válidos —el registro existe
 * y se guardó válido—, así que obligar a pasar por los seis para corregir el
 * serial sería una traba sin ninguna razón detrás. Al guardar se validan TODOS
 * los pasos, no solo el visible, y si alguno falla el modal salta a él: si no,
 * el usuario vería un error de un campo que no tiene delante.
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
    // Texto del botón que cierra el flujo
    textoGuardar = "Guardar",
    guardando = false,
    modo = "crear",
}) {
    const [indice, setIndice] = useState(0);
    // Pasos ya visitados: en modo crear son los únicos a los que se puede volver
    // pulsando el indicador. Empieza con el primero porque ya se está viendo.
    const [vistos, setVistos] = useState(() => new Set([0]));
    const [ocupado, setOcupado] = useState(false);

    // Para volver al paso 1 al reabrirse, el PADRE pasa una `key` distinta y el
    // componente se remonta. Es la convención del proyecto para el estado inicial
    // de un modal: sincronizarlo con un useEffect obliga a un setState dentro del
    // efecto, que encadena un render extra y que el linter marca.

    if (!pasos.length) return null;

    const total = pasos.length;
    const esUltimo = indice === total - 1;
    const paso = pasos[indice];
    const esEdicion = modo === "editar";

    const irA = (i) => {
        setIndice(i);
        setVistos((previos) => new Set(previos).add(i));
    };

    const siguiente = async () => {
        if (paso.validate) {
            setOcupado(true);
            try {
                const ok = await paso.validate();
                if (!ok) return;
            } finally {
                setOcupado(false);
            }
        }
        irA(Math.min(indice + 1, total - 1));
    };

    const atras = () => irA(Math.max(indice - 1, 0));

    // Saltar directamente a un paso desde el indicador.
    // - Editando: a cualquiera, sin validar de paso. Validar al salir obligaría a
    //   arreglar el paso actual para poder ir a mirar otro, y mirar no es guardar.
    // - Creando: solo hacia atrás, a lo ya visitado; volver nunca puede fallar.
    const saltarA = (i) => {
        if (i === indice) return;
        if (!esEdicion && !vistos.has(i)) return;
        irA(i);
    };

    const guardar = async () => {
        setOcupado(true);
        try {
            // Se validan TODOS los pasos, no solo el visible, en los dos modos.
            //
            // Editando es evidente: se pudo saltar a cualquier paso y guardar
            // desde ahí sin haber visto los demás.
            //
            // Creando parece innecesario —para llegar al último hubo que superar
            // los anteriores— pero no lo es: se puede volver atrás por el
            // indicador, romper un campo ya válido y saltar de nuevo al último
            // paso, que sí está visitado. Validar solo el visible dejaría pasar
            // ese dato roto.
            for (const [p, i] of pasos.map((x, idx) => [x, idx])) {
                if (!p.validate) continue;
                const ok = await p.validate();
                if (!ok) {
                    // Saltar al paso que falló: dejar al usuario en otro paso con
                    // un error invisible es la peor forma de rechazar un guardado.
                    if (i !== indice) irA(i);
                    return;
                }
            }

            await onSubmit?.();
        } finally {
            setOcupado(false);
        }
    };

    const botonGuardar = (
        <Button variant="primary" size="sm" onClick={guardar} disabled={ocupado || guardando}>
            {guardando ? "Guardando..." : textoGuardar}
        </Button>
    );

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
                    {/* (p50) Antes esto era CancelButton, que tenía DOS problemas
                        aquí: no aceptaba `onClick` —hacía siempre `navigate(-1)`,
                        o sea que cancelar dentro de un modal te sacaba de la
                        página en vez de cerrarlo— y no pasaba `size`, así que
                        salía más grande que Atrás y Siguiente. Es un Button normal
                        como el de los demás pies del proyecto.

                        `mr-3` lo separa de los botones de navegación: sumado al
                        gap-4 del pie quedan 28px, porque cancelar no es un paso
                        más del recorrido y no debe leerse en la misma tanda. */}
                    <Button variant="secondary" size="sm" className="mr-3"
                            onClick={onClose} disabled={guardando}>
                        Cancelar
                    </Button>
                    {indice > 0 && (
                        <Button variant="secondary" size="sm" onClick={atras} disabled={ocupado || guardando}>
                            Atrás
                        </Button>
                    )}
                    {/* Editando, Guardar está siempre disponible y Siguiente
                        acompaña hasta el último paso. Creando, uno sustituye al
                        otro: no hay nada que guardar hasta terminar. */}
                    {!esUltimo && (
                        <Button variant={esEdicion ? "secondary" : "primary"} size="sm"
                                onClick={siguiente} disabled={ocupado || guardando}>
                            Siguiente
                        </Button>
                    )}
                    {(esEdicion || esUltimo) && botonGuardar}
                </>
            }
        >
            {/* Indicador de progreso. Las barras se reparten el ancho por igual
                con flex-1: así el número de pasos puede cambiar por módulo (4, 5
                o 6) sin escribir ninguna medida. */}
            <div className="mb-6">
                <div
                    className="flex items-center gap-2"
                    role="progressbar"
                    aria-valuenow={indice + 1}
                    aria-valuemin={1}
                    aria-valuemax={total}
                >
                    {pasos.map((p, i) => {
                        const alcanzable = esEdicion || vistos.has(i);
                        return (
                            <button
                                key={p.titulo ?? i}
                                type="button"
                                onClick={() => saltarA(i)}
                                disabled={!alcanzable || ocupado || guardando}
                                aria-label={`Paso ${i + 1}: ${p.titulo}`}
                                aria-current={i === indice ? "step" : undefined}
                                // py-2 -my-2 agranda el área pulsable sin agrandar
                                // la barra: una barra de 6px es imposible de
                                // acertar con el dedo.
                                className="flex-1 py-2 -my-2 disabled:cursor-default enabled:cursor-pointer group"
                            >
                                <span
                                    className={`block h-1.5 rounded-full transition-colors ${
                                        i <= indice ? "bg-button-primary" : "bg-surface-muted"
                                    } ${alcanzable ? "group-hover:bg-button-primary-hover" : ""}`}
                                />
                            </button>
                        );
                    })}
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-4">
                    <h3 className="font-main text-h3 font-bold">{paso.titulo}</h3>
                    <span className="font-secondary text-caption text-text-muted shrink-0">
                        Paso {indice + 1} de {total}
                    </span>
                </div>
            </div>

            {/* Solo se renderiza el paso actual: montar todos y ocultarlos con CSS
                dispararía las peticiones de todos los selects al abrir el modal.

                Consecuencia importante para los consumidores: el estado del
                formulario NO puede vivir dentro del JSX de cada paso, porque se
                desmonta al cambiar de paso. Vive en el componente que construye
                los pasos, que es además quien tiene el schema. */}
            {paso.contenido}
        </Modal>
    );
}
