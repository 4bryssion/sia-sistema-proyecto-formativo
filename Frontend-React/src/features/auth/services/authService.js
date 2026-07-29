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