// (p49) Ventana de vida de la sesión en el servidor.
//
// El problema que resuelve: el servidor guardaba la sesión viva hasta que
// expiraba el JWT (8 h). Si el navegador se cerraba —por el usuario, por un
// cierre forzado o por un corte de luz— nadie avisaba, y la cuenta quedaba
// bloqueada durante horas contra su propio dueño.
//
// Ahora la sesión solo sigue viva mientras el navegador dé señales de vida: el
// frontend manda un latido periódico y cada petición autenticada renueva la
// ventana. Sin navegador no hay latidos, y la sesión se libera sola.
//
// VENTANA debe ser holgadamente mayor que el intervalo de latido del frontend
// (LATIDO_MS en shared/services/sessionHeartbeat.js): un par de latidos perdidos
// —pestaña en segundo plano, red intermitente— no pueden costar la sesión.
export const VENTANA_SESION_MS = 5 * 60 * 1000; // 5 minutos

// Al cerrar la pestaña el frontend avisa y la ventana se recorta a esto en vez
// de cerrarse de golpe. No se cierra de golpe porque `pagehide` no distingue
// entre cerrar y RECARGAR: con un cierre inmediato, pulsar F5 echaría al
// usuario. Con la gracia, una recarga vuelve a latir antes de que venza y la
// sesión continúa; un cierre de verdad no vuelve, y se libera en segundos.
export const GRACIA_CIERRE_MS = 20 * 1000; // 20 segundos

// Renovar en CADA petición sería una escritura por petición. Solo se renueva
// cuando queda menos de esta fracción de la ventana.
export const UMBRAL_RENOVACION = 0.5;
