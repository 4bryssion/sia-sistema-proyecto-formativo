const API_URL = "http://localhost:5000/api/auth";

// Limpieza local de la sesión. Se separa de `logout` porque el interceptor de 401
// necesita limpiar SIN avisar al backend: ese token ya no vale, la petición de
// logout volvería a fallar con 401 y entraría en bucle.
export function clearSession(){
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    // Nombre completo cacheado para el encabezado de los reportes (authStorage)
    sessionStorage.removeItem("userName");
}

// Cierre de sesión completo. Con sesión única (p45) el logout dejó de ser solo
// client-side: hay que avisar al backend para que libere el jti activo, o la
// cuenta quedaría bloqueada ("ya tienes una sesión iniciada") hasta que venciera
// el token. Usa fetch, igual que el resto de auth (ver CLAUDE.md §4.2).
export async function logout(){
    const token = sessionStorage.getItem("token");

    if (token) {
        try {
            await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // Si el backend no responde, igual se cierra la sesión localmente: la
            // sesión del servidor caduca sola al vencer el token, así que el
            // usuario no queda bloqueado de forma permanente.
        }
    }

    clearSession();
}
