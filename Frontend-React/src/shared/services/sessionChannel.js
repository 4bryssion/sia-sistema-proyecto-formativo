// Detección de sesión activa en OTRA pestaña del mismo navegador.
//
// Por qué hace falta: el token vive en sessionStorage, que es por pestaña. Al
// duplicar una pestaña el navegador copia ese sessionStorage, y si en la copia se
// inicia sesión con OTRO usuario el backend no ve conflicto (son usuarios
// distintos, cada uno con su propio jti), así que la sesión única del servidor no
// lo detecta. Este canal cubre exactamente ese hueco.
//
// Por qué BroadcastChannel y no localStorage: un marcador en localStorage hay que
// mantenerlo vivo con heartbeats y decidir cuándo está "viejo" (si el navegador se
// cierra de golpe, el marcador queda huérfano y bloquea el login para siempre).
// Con un ping solo responden las pestañas que existen AHORA: no hay estado que
// pueda quedar sucio.

const CHANNEL_NAME = "sii-session";
const PING = "ping";
const PONG = "pong";

// Tiempo de espera del ping. 250 ms es de sobra para un mensaje entre pestañas
// del mismo navegador (es memoria compartida, no red) y no se percibe al iniciar sesión.
const PING_TIMEOUT_MS = 250;

const supported = typeof BroadcastChannel !== "undefined";

// BroadcastChannel no reenvía el mensaje al OBJETO que lo emitió, pero sí a otras
// instancias de la MISMA pestaña — y el listener de App es una instancia distinta
// a la que hace el ping. Con un id por pestaña se ignoran los propios mensajes.
const TAB_ID = Math.random().toString(36).slice(2);

const open = () => (supported ? new BroadcastChannel(CHANNEL_NAME) : null);

/**
 * Mantiene esta pestaña "respondiendo" mientras tenga sesión activa.
 * Se monta una sola vez desde App: cualquier pestaña con token contesta los pings.
 * @returns {() => void} función de limpieza
 */
export function listenForSessionPings() {
    const channel = open();
    if (!channel) return () => {};

    channel.onmessage = (event) => {
        if (event.data?.type !== PING) return;
        if (event.data.from === TAB_ID) return; // ping propio: no cuenta

        const raw = sessionStorage.getItem("user");
        if (!sessionStorage.getItem("token")) return; // sin sesión, no responde

        let user = null;
        try { user = raw ? JSON.parse(raw) : null; } catch { user = null; }

        channel.postMessage({ type: PONG, from: TAB_ID, email: user?.email ?? null });
    };

    return () => channel.close();
}

/**
 * Pregunta si alguna otra pestaña de este navegador tiene sesión abierta.
 * @returns {Promise<{active: boolean, email: string|null}>}
 */
export function askOtherTabsForSession() {
    const channel = open();
    if (!channel) return Promise.resolve({ active: false, email: null });

    return new Promise((resolve) => {
        const finish = (result) => {
            clearTimeout(timer);
            channel.close();
            resolve(result);
        };

        channel.onmessage = (event) => {
            if (event.data?.type !== PONG) return;
            if (event.data.from === TAB_ID) return; // respuesta de esta misma pestaña
            finish({ active: true, email: event.data.email ?? null });
        };

        // Sin respuesta dentro del plazo = no hay otra pestaña con sesión
        const timer = setTimeout(() => finish({ active: false, email: null }), PING_TIMEOUT_MS);

        channel.postMessage({ type: PING, from: TAB_ID });
    });
}

// No hace falta avisar del logout: cada pestaña responde el ping mirando SU
// propio sessionStorage, así que la que cierra sesión deja de contestar sola.
