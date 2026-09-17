// Servicio de autenticación.
//
// Vivía en features/auth/services/. Bajó a shared (p48, fase 8) porque
// `changePassword` lo necesita el modal de cambiar contraseña, que es
// compartido: lo abren "Mi perfil" y el bloqueo del primer inicio de sesión.
// Por la regla de módulos cruzados, lo que usan varios módulos vive en shared.
//
// TODO el archivo usa `fetch` nativo a propósito — ver CLAUDE.md §4.2. No se
// migra a axiosInstance porque su interceptor cierra la sesión ante cualquier
// 401, y aquí el 401 es un caso NORMAL: es lo que responde el backend cuando la
// contraseña actual que escribió el usuario no coincide. Con axios, equivocarse
// al escribirla te echaría del sistema.

const API_URL = "http://localhost:5000/api/auth";

export async function login(userData) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: userData.userEmail,
            password: userData.userPassword,
        }),
    });

    if (!response.ok){
        const error = await response.json();
        const err = new Error(error.error || "Error login");
        // 409 = credenciales correctas pero ya hay una sesión abierta en otro
        // navegador (sesión única, p45). El formulario lo distingue del 401 para
        // mostrar una alerta distinta.
        err.status = response.status;
        throw err;
    }

    // (p48) La respuesta trae además `mustChangePassword`: con el flag activo el
    // resto del API responde 403 hasta que se cambie la contraseña temporal.
    return response.json();
}

// Las tres funciones de recuperación de contraseña usan fetch (igual que login) — ver CLAUDE.md §4.2.
// No se usan axiosInstance para no acoplar el flujo al interceptor de 401, que redirige a /auth
// y provocaría bucles de redirección si el backend devolviera algo distinto de 200/400.

export async function forgotPassword(email) {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "No se pudo enviar el código");
    }
    return response.json();
}

export async function verifyResetCode({ userEmail, userCodeRecover }) {
    const response = await fetch(`${API_URL}/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code: userCodeRecover }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Código inválido");
    }
    return response.json(); // { mensaje, resetTicket }
}

export async function resetPassword({ resetTicket, newPassword }) {
    const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetTicket, password: newPassword }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "No se pudo actualizar la contraseña");
    }
    return response.json();
}

/**
 * (p48) Cambio de contraseña CON sesión iniciada. Sirve a los dos casos, porque
 * en ambos hay que demostrar que se conoce la contraseña actual:
 *   1. "Mi perfil → Cambiar contraseña", voluntario.
 *   2. Primer inicio de sesión, obligatorio (bloquea el resto del API con 403).
 *
 * El token se adjunta a mano: esta función NO pasa por el axiosInstance, que es
 * quien normalmente lo inyecta.
 *
 * El error lleva `status` para que quien llame pueda distinguir el 401
 * (contraseña actual incorrecta) del 400 (nueva igual a la actual, o sin la
 * complejidad exigida) y del 429 del limitador.
 */
export async function changePassword({ currentPassword, newPassword }) {
    const token = sessionStorage.getItem("token");
    const response = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        // Dos clases de 401 muy distintas, y confundirlas deja al usuario
        // repitiendo bien su contraseña mientras el sistema le dice que está mal:
        //
        // - authService (backend) responde { error } → la contraseña ACTUAL no
        //   coincide. Es el caso normal, se corrige escribiéndola de nuevo.
        // - authenticateToken responde { message } (inconsistencia documentada en
        //   CLAUDE.md §3.5) → token vencido, cuenta desactivada o sesión cerrada
        //   desde otro lugar. Aquí no hay nada que reescribir: hay que volver a
        //   entrar. Como esta función NO pasa por el interceptor de axios, nadie
        //   más va a detectarlo.
        const esSesion = response.status === 401 && !error.error && !!error.message;
        const err = new Error(
            error.detalles?.join(" · ") ||
            error.error ||
            error.message ||
            "No se pudo cambiar la contraseña",
        );
        err.status = response.status;
        err.sessionExpired = esSesion;
        throw err;
    }
    return response.json();
}
