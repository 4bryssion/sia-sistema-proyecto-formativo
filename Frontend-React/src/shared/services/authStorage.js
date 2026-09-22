// src/shared/services/authStorage.js
//
// ÚNICO dueño del almacenamiento de la sesión en el navegador. Nadie más lee ni
// escribe `localStorage` para esto: si el sitio donde vive la sesión vuelve a
// cambiar, se cambia aquí y solo aquí.
//
// (p49) Por qué localStorage y no sessionStorage:
//
// - sessionStorage es POR PESTAÑA. Al duplicar una pestaña el navegador copia su
//   contenido, así que dos pestañas podían tener sesiones distintas: había que
//   inventar un canal entre pestañas (sessionChannel.js, ya eliminado) para
//   detectar ese caso a mano. Con localStorage todas las pestañas comparten una
//   sola sesión, que es lo que "sesión única" significa de verdad.
// - Además sessionStorage muere al cerrar la pestaña, mientras el servidor
//   conservaba la sesión durante horas: el token se perdía y la cuenta quedaba
//   bloqueada contra su propio dueño. Ahora el cierre de la sesión lo decide el
//   servidor por falta de latido (config/session.js del backend), no el hecho de
//   que el navegador tirara el token.
//
// Que el token sobreviva al cierre del navegador NO significa que la sesión
// sobreviva: al volver, el servidor ya la liberó y la primera petición responde
// 401, que el interceptor convierte en "vuelve a iniciar sesión".

const TOKEN_KEY = "token";
const USER_KEY = "user";
const NAME_KEY = "userName";
const MUST_CHANGE_KEY = "mustChangePassword";
// (p49) Momento de la última interacción real del usuario. Va en localStorage y
// no en una variable de módulo a propósito: si cada pestaña llevara su propio
// reloj, una pestaña olvidada en segundo plano cerraría la sesión mientras el
// usuario trabaja en otra — y la sesión es una sola para todas.
const ACTIVITY_KEY = "lastActivity";
// (p50) Marca de que ESTA pestaña fue la que inició la sesión. Es lo ÚNICO que
// vive en sessionStorage, y precisamente por lo que sessionStorage sirve: es por
// pestaña. La sesión sigue siendo una sola y compartida en localStorage; esto no
// es otra sesión, es solo saber quién la abrió.
//
// Para qué hace falta: GuestRoute cierra la sesión al llegar a /auth, para que
// la flecha atrás no sea una vía de vuelta al dashboard. Sin esta marca, una
// pestaña cualquiera parada en el login cerraba la sesión que otra ventana
// acababa de abrir — bastaba con recargarla.
//
// Sobrevive a un F5, que es el caso que se repite. Si la pestaña se cierra, la
// marca se va con ella, pero entonces `pagehide` ya recortó la ventana de la
// sesión a segundos: no queda nada huérfano.
const OWNER_KEY = "sesionAbiertaAqui";

// localStorage puede lanzar (modo privado con almacenamiento bloqueado, cuota
// llena). Una excepción aquí dejaría la aplicación en blanco, así que se degrada
// a "no hay sesión" en vez de romper.
const leer = (clave) => {
  try { return localStorage.getItem(clave); } catch { return null; }
};
const guardar = (clave, valor) => {
  try { localStorage.setItem(clave, valor); } catch { /* sin almacenamiento */ }
};
const borrar = (clave) => {
  try { localStorage.removeItem(clave); } catch { /* sin almacenamiento */ }
};

/* ============================== Token ============================== */

export function getToken() {
  return leer(TOKEN_KEY);
}

export function setSession(token, user) {
  guardar(TOKEN_KEY, token);
  guardar(USER_KEY, JSON.stringify(user));
  marcarPestanaDuena();
  markActivity(); // entrar cuenta como interacción: el reloj arranca aquí
}

/* ================= De quién es la sesión (p50) ================= */

/** Esta pestaña acaba de iniciar sesión: queda como su dueña. */
function marcarPestanaDuena() {
  try { sessionStorage.setItem(OWNER_KEY, "1"); } catch { /* sin almacenamiento */ }
}

/**
 * ¿Fue ESTA pestaña la que abrió la sesión que hay en curso?
 *
 * Solo la usa GuestRoute, para no cerrar una sesión que no es suya. No sustituye
 * a ninguna comprobación de seguridad: quién puede hacer qué lo siguen decidiendo
 * el token y los permisos, y la sesión única la sigue imponiendo el backend.
 */
export function estaPestanaAbrioLaSesion() {
  try { return sessionStorage.getItem(OWNER_KEY) === "1"; } catch { return false; }
}

/** Borra todo rastro local de la sesión. No avisa al backend — eso es logout(). */
export function clearStoredSession() {
  borrar(TOKEN_KEY);
  borrar(USER_KEY);
  borrar(NAME_KEY);
  borrar(MUST_CHANGE_KEY);
  borrar(ACTIVITY_KEY);
  try { sessionStorage.removeItem(OWNER_KEY); } catch { /* sin almacenamiento */ }
}

/* ==================== Reloj de inactividad (p49) ==================== */

/** Marca que el usuario acaba de interactuar. Lo comparten todas las pestañas. */
export function markActivity() {
  guardar(ACTIVITY_KEY, String(Date.now()));
}

/**
 * Milisegundos transcurridos desde la última interacción.
 *
 * Si no hay marca (sesión recién restaurada, almacenamiento bloqueado) devuelve
 * 0: ante la duda se asume que el usuario ESTÁ, porque equivocarse hacia el otro
 * lado echaría a alguien que está trabajando.
 */
export function msDesdeUltimaInteraccion() {
  const marca = Number(leer(ACTIVITY_KEY));
  if (!marca || Number.isNaN(marca)) return 0;
  // Un reloj del sistema movido hacia atrás daría negativo; se acota a 0.
  return Math.max(0, Date.now() - marca);
}

/* ============================== Usuario ============================== */

/** { id, email } del usuario autenticado, o null. */
export function getCurrentUser() {
  try {
    const raw = leer(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Nombre completo cacheado.
//
// El login solo devuelve { id, email } — así está fijado el contrato en
// CLAUDE.md §3.1 y no se toca. Pero los encabezados de los reportes deben
// identificar al usuario generador con su nombre, no con su correo. En vez de
// pedirlo cada vez que se genera un reporte (y volver asíncrona toda la
// generación), se resuelve UNA vez al entrar al dashboard y se cachea aquí.

/** Nombre completo del usuario autenticado; null si aún no se ha resuelto */
export function getCurrentUserName() {
  return leer(NAME_KEY) || null;
}

export function setCurrentUserName(name) {
  if (name) guardar(NAME_KEY, name);
}

export function clearCurrentUserName() {
  borrar(NAME_KEY);
}

/** Nombre completo si está cacheado; si no, el correo. Nunca vacío. */
export function getCurrentUserLabel() {
  return getCurrentUserName() ?? getCurrentUser()?.email ?? "—";
}

/* ==================== Contraseña temporal (p48) ==================== */

// El login devuelve `mustChangePassword`. Se guarda aquí porque el bloqueo no
// puede depender de volver a preguntar al backend: con el flag activo TODAS sus
// rutas responden 403 menos change-password, logout y el latido, así que no hay
// ningún endpoint al que preguntar "¿sigo obligado?".

// El evento `storage` del navegador solo se dispara en las OTRAS pestañas, nunca
// en la que escribe. Como el flag lo puede activar el interceptor de axios en
// cualquier momento (un 403 con mustChangePassword), se avisa con un evento
// propio para que el bloqueo aparezca sin recargar.
export const MUST_CHANGE_EVENT = "sii:must-change-password";

export function setMustChangePassword(value) {
  if (value) guardar(MUST_CHANGE_KEY, "1");
  else borrar(MUST_CHANGE_KEY);
  window.dispatchEvent(new CustomEvent(MUST_CHANGE_EVENT, { detail: !!value }));
}

export function getMustChangePassword() {
  return leer(MUST_CHANGE_KEY) === "1";
}

export function clearMustChangePassword() {
  setMustChangePassword(false);
}

/* ==================== Sincronía entre pestañas ==================== */

/**
 * (p49) Avisa cuando la sesión cambia en OTRA pestaña.
 *
 * El evento `storage` solo llega a las pestañas que NO hicieron el cambio, que
 * es exactamente lo que hace falta: si en una pestaña se cierra sesión o se entra
 * con otra cuenta, las demás no pueden seguir mostrando datos de la anterior.
 *
 * Sustituye al canal entre pestañas que existía antes (sessionChannel.js): con
 * el token compartido en localStorage ya no hay dos sesiones que reconciliar,
 * solo una que replicar.
 *
 * @param {(estado: {token: string|null, userId: number|null}) => void} alCambiar
 * @returns {() => void} función de limpieza
 */
export function onSessionChange(alCambiar) {
  const manejar = (e) => {
    if (e.key !== null && e.key !== TOKEN_KEY && e.key !== USER_KEY) return;
    alCambiar({ token: getToken(), userId: getCurrentUser()?.id ?? null });
  };
  window.addEventListener("storage", manejar);
  return () => window.removeEventListener("storage", manejar);
}
