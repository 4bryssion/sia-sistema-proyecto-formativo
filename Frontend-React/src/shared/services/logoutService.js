import { clearStoredSession, getToken } from "@/shared/services/authStorage";

const API_URL = "http://localhost:5000/api/auth";

// Limpieza local de la sesión. Se separa de `logout` porque el interceptor de 401
// necesita limpiar SIN avisar al backend: ese token ya no vale, la petición de
// logout volvería a fallar con 401 y entraría en bucle.
//
// (p49) El borrado en sí vive en authStorage, que es el único que sabe dónde se
// guarda la sesión.
export function clearSession(){
    clearStoredSession();
}

// Cierre de sesión completo. Con sesión única (p45) el logout no es solo
// client-side: hay que avisar al backend para que libere el jti activo. Usa
// fetch, igual que el resto de auth (ver CLAUDE.md §4.2).
export async function logout(){
    const token = getToken();

    if (token) {
        try {
            await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // Si el backend no responde, igual se cierra la sesión localmente: la
            // sesión del servidor se libera sola al dejar de recibir latidos
            // (p49), así que el usuario no queda bloqueado.
        }
    }

    clearSession();
}

/**
 * (p49) Aviso de que la pestaña se está cerrando.
 *
 * No es un logout: `pagehide` se dispara igual al RECARGAR, y cerrar la sesión
 * ahí echaría al usuario cada vez que pulsa F5. Lo que hace el backend con este
 * aviso es recortar la ventana de la sesión a unos segundos — si era una
 * recarga, la página vuelve y late antes de que venza; si era un cierre de
 * verdad, la sesión queda libre casi de inmediato en vez de esperar a que se
 * agote la ventana completa.
 *
 * `keepalive` es lo que permite que el navegador despache la petición aunque la
 * página ya se esté yendo; un fetch normal se cancelaría. Por eso tampoco se usa
 * `await`: no hay a quién devolverle el resultado.
 */
export function notifySessionEnding(){
    const token = getToken();
    if (!token) return;

    try {
        fetch(`${API_URL}/session-ending`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            keepalive: true,
        }).catch(() => {});
    } catch {
        // Un fallo aquí no puede impedir que la pestaña se cierre. Si no llega,
        // la sesión se libera igual cuando se agote la ventana de latido.
    }
}
