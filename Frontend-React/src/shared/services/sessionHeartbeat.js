import {
    getToken,
    markActivity,
    msDesdeUltimaInteraccion,
} from "@/shared/services/authStorage";
import { notifySessionEnding, logout } from "@/shared/services/logoutService";
import { Alert } from "@/shared/components/utils/alert.js";

const API_URL = "http://localhost:5000/api/auth";

// (p49) Este servicio vigila DOS cosas distintas, y conviene no confundirlas:
//
//   1. ¿Sigue existiendo el navegador?  -> el latido.
//      Mientras la pestaña viva manda una señal periódica y el servidor empuja el
//      vencimiento de la sesión hacia adelante. Si el navegador desaparece —lo
//      cierran, se congela el sistema, se va la luz— las señales paran y el
//      servidor libera la sesión solo. No depende de que nadie avise, y por eso
//      es lo único que funciona ante un corte de luz.
//
//   2. ¿Sigue la persona delante?  -> el reloj de inactividad.
//      Es un requisito de seguridad distinto: el equipo desatendido en el
//      ambiente de formación. Aquí el navegador SÍ existe, así que el latido por
//      sí solo no lo detectaría nunca.
//
// Se unen con una sola regla: EL LATIDO SOLO SE MANDA SI HUBO INTERACCIÓN
// RECIENTE. Así, alejarse tiene el mismo efecto que cerrar el navegador —dejan de
// llegar señales y el servidor libera la sesión— sin añadir ni una tabla ni un
// endpoint más. El cierre explícito que hace el frontend al cumplirse el tiempo
// es solo para que sea inmediato y con aviso; si esa petición se perdiera, el
// servidor cerraría igual por falta de latidos.

// Cada cuánto se avisa al servidor de que este navegador sigue abierto. Debe ser
// holgadamente menor que VENTANA_SESION_MS del backend (5 min): así un par de
// latidos perdidos —pestaña en segundo plano, red intermitente— no cuestan la
// sesión. 45 s da más de seis latidos por ventana.
const LATIDO_MS = 45 * 1000;

// Inactividad tolerada antes de cerrar la sesión.
const INACTIVIDAD_MS = 15 * 60 * 1000;

// Cuánto antes del cierre se avisa. Sin este aviso, quien esté a mitad de un
// modal de 6 pasos perdería lo diligenciado sin poder evitarlo.
const AVISO_MS = 60 * 1000;

// Cada cuánto se revisa el reloj. 5 s es suficiente para que el aviso salga a
// tiempo y el coste es nulo: solo lee un número y resta.
const REVISION_MS = 5 * 1000;

// Interacciones que cuentan como "el usuario está aquí". NO se escucha
// `mousemove`: dispara cientos de veces por segundo y un roce accidental del
// ratón mantendría viva una sesión abandonada, que es justo lo que se quiere
// evitar. Escribir, pulsar, tocar o desplazar sí son intención.
const EVENTOS_DE_USO = ["pointerdown", "keydown", "wheel", "touchstart"];

// Escribir en el almacenamiento en cada tecla sería absurdo; basta con refrescar
// la marca de vez en cuando, porque lo que se mide son minutos.
const MARCA_CADA_MS = 10 * 1000;

// ---------------------------------------------------------------------------
// (p50) Una ventana parada en el login NO está usando ninguna sesión.
//
// El fallo que esto cierra: el token vive en localStorage, que comparten TODAS
// las ventanas del navegador. Una ventana en /auth leía el token de OTRA ventana
// y latía con él, así que mantenía viva indefinidamente una sesión que no era
// suya. El caso concreto: cerrabas la ventana con la sesión, volvías a la del
// login, y al traerla al frente `visibilitychange` disparaba un latido que
// resucitaba la sesión recién cerrada. Resultado: nunca podías entrar, porque la
// propia ventana que lo intentaba era la que mantenía el bloqueo.
//
// Lo mismo valía para los otros dos caminos: a los 15 minutos esa ventana habría
// llamado a logout() con el token ajeno, y al cerrarla habría mandado el aviso de
// `pagehide` recortando una sesión que alguien estaba usando.
//
// El contador es por VENTANA (es estado de módulo, y cada ventana carga el suyo),
// que es justo el alcance que hace falta. Es un contador y no un booleano porque
// nada impide que haya más de una pantalla de invitado montada a la vez.
let pantallasDeInvitado = 0;

const enLogin = () => pantallasDeInvitado > 0;

/**
 * Lo llama GuestRoute al montarse: esta ventana está mostrando el login.
 * Mientras tanto la vigilancia de sesión queda inerte aquí.
 *
 * @returns {() => void} función de limpieza que la reanuda
 */
export function marcarVentanaEnLogin() {
    pantallasDeInvitado += 1;
    return () => { pantallasDeInvitado = Math.max(0, pantallasDeInvitado - 1); };
}
// ---------------------------------------------------------------------------

/**
 * Mantiene viva la sesión mientras el usuario esté usando el sistema, y la cierra
 * cuando deja de estarlo o cuando el navegador desaparece.
 *
 * Se monta una sola vez desde App, no en un layout: debe seguir vigilando esté
 * donde esté el usuario dentro del sistema.
 *
 * @returns {() => void} función de limpieza
 */
export function startSessionHeartbeat() {
    let ultimaMarca = 0;
    let avisoAbierto = false;
    let cerrando = false;

    const registrarUso = () => {
        const ahora = Date.now();
        if (ahora - ultimaMarca < MARCA_CADA_MS) return;
        ultimaMarca = ahora;
        markActivity();
    };

    const latir = () => {
        // Sin sesión PROPIA no hay nada que mantener vivo. Las dos condiciones
        // son distintas: la primera es "no hay token"; la segunda, "hay token
        // pero es de otra ventana".
        if (enLogin()) return;
        const token = getToken();
        if (!token) return;

        fetch(`${API_URL}/heartbeat`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {
            // Un latido perdido no se reintenta ni se reporta: el siguiente llega
            // en segundos y la ventana aguanta varios fallos seguidos. Avisar de
            // un fallo de red que se va a resolver solo sería ruido.
        });
    };

    const cerrarPorInactividad = async () => {
        if (cerrando) return;
        cerrando = true;

        if (avisoAbierto) {
            Alert.close();
            avisoAbierto = false;
        }

        await logout();
        await Alert.error(
            "Sesión cerrada",
            "Cerramos tu sesión porque pasaste un rato sin usar el sistema. Vuelve a ingresar para continuar.",
        );
        // Recarga completa además de navegar: deja fuera cualquier estado de
        // React que hubiera quedado colgando de la sesión anterior.
        window.location.href = "/auth";
    };

    const avisar = async () => {
        avisoAbierto = true;
        const { isConfirmed } = await Alert.confirm(
            "¿Sigues ahí?",
            "Tu sesión se cerrará en un minuto por inactividad.",
            { confirmText: "Sigo aquí", cancelText: "Cerrar sesión" },
        );
        avisoAbierto = false;

        // Responder YA es interacción: pulsar "Sigo aquí" reinicia el reloj, y
        // como la marca se comparte, las demás pestañas cierran su aviso solas.
        if (isConfirmed) {
            ultimaMarca = 0; // fuerza la reescritura de la marca
            registrarUso();
            latir();
            return;
        }
        // "Cerrar sesión": el usuario decidió salir, no hay por qué esperar.
        cerrarPorInactividad();
    };

    const revisar = () => {
        // `enLogin()` primero: sin esto, una ventana en el login cerraría por
        // inactividad la sesión que otra está usando.
        if (enLogin() || cerrando || !getToken()) return;

        const inactivo = msDesdeUltimaInteraccion();

        if (inactivo >= INACTIVIDAD_MS) {
            cerrarPorInactividad();
            return;
        }

        // Volvió a haber actividad (aquí o en otra pestaña) mientras el aviso
        // seguía en pantalla: se retira, ya no aplica.
        if (avisoAbierto && inactivo < INACTIVIDAD_MS - AVISO_MS) {
            Alert.close();
            avisoAbierto = false;
            return;
        }

        if (!avisoAbierto && inactivo >= INACTIVIDAD_MS - AVISO_MS) avisar();
    };

    const latirSiHayUso = () => {
        // La regla que une las dos vigilancias: sin interacción reciente no se
        // late, y sin latidos el servidor libera la sesión igual que si se
        // hubiera cerrado el navegador.
        if (msDesdeUltimaInteraccion() < INACTIVIDAD_MS) latir();
    };

    EVENTOS_DE_USO.forEach((evento) =>
        window.addEventListener(evento, registrarUso, { passive: true }),
    );

    // Inmediato además de periódico: tras una recarga, la ventana viene recortada
    // por el aviso de cierre de la carga anterior y hay que restituirla ya.
    latirSiHayUso();
    const temporizadorLatido = setInterval(latirSiHayUso, LATIDO_MS);
    const temporizadorRevision = setInterval(revisar, REVISION_MS);

    // Al volver de segundo plano: el navegador pudo congelar los temporizadores
    // mientras la pestaña estaba oculta, así que se revisa y se late al verla.
    const alVolver = () => {
        if (document.visibilityState !== "visible") return;
        latirSiHayUso();
        revisar();
    };
    document.addEventListener("visibilitychange", alVolver);

    // `pagehide` y no `beforeunload`: es el que los navegadores garantizan al
    // cerrar (incluido móvil) y no muestra ningún diálogo al usuario.
    //
    // Cerrar una ventana que solo mostraba el login no puede recortarle la sesión
    // a la ventana que sí la está usando.
    const alCerrar = () => { if (!enLogin()) notifySessionEnding(); };
    window.addEventListener("pagehide", alCerrar);

    return () => {
        clearInterval(temporizadorLatido);
        clearInterval(temporizadorRevision);
        EVENTOS_DE_USO.forEach((evento) =>
            window.removeEventListener(evento, registrarUso),
        );
        document.removeEventListener("visibilitychange", alVolver);
        window.removeEventListener("pagehide", alCerrar);
    };
}
