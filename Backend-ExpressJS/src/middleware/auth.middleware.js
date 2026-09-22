import jwt from "jsonwebtoken";
import { authRepository } from "../features/auth/auth.repository.js";
import { VENTANA_SESION_MS, UMBRAL_RENOVACION } from "../config/session.js";

// (p48) Rutas que siguen abiertas mientras el usuario tenga la contraseña temporal.
// Son las dos únicas salidas posibles de ese estado: cambiarla o cerrar sesión.
// Bloquear también estas dejaría la cuenta atrapada sin forma de avanzar.
//
// El bloqueo se hace AQUÍ y no en el frontend porque el frontend solo redirige:
// quien llame al API directamente con su token se saltaría la obligación.
const RUTAS_PERMITIDAS_SIN_CAMBIAR_CLAVE = [
    "/api/auth/change-password",
    "/api/auth/logout",
    // (p49) El latido y el aviso de cierre también: si se bloquearan, la sesión
    // de quien está atascado en el cambio obligatorio se moriría bajo sus pies
    // mientras escribe su contraseña nueva.
    "/api/auth/heartbeat",
    "/api/auth/session-ending",
];

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token requerido",
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token inválido",
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({
            message: "Token inválido o expirado",
        });
    }

    // Sesión única (p45): la firma del token es válida, pero además debe ser EL
    // token de la sesión activa. Esta comprobación es la que mata al instante una
    // sesión reemplazada o cerrada desde otro lado; sin ella el JWT seguiría
    // sirviendo hasta su expiración natural (es stateless por diseño).
    try {
        const state = await authRepository.findSessionState(decoded.id);

        if (!state || !state.isActive) {
            return res.status(401).json({ message: "La cuenta no está activa." });
        }

        // Los tokens emitidos ANTES de p45 no llevan jti. Se rechazan a propósito:
        // aceptarlos dejaría un hueco por el que se saltaría la sesión única.
        if (!decoded.jti || decoded.jti !== state.activeSessionJti) {
            return res.status(401).json({
                message: "Tu sesión se cerró porque se inició sesión desde otro lugar.",
            });
        }

        // (p49) La sesión vencida se rechaza AQUÍ. Antes no hacía falta: el
        // vencimiento de la sesión coincidía con el del token, así que uno
        // implicaba el otro. Ahora la ventana de la sesión es mucho más corta
        // que el token, y sin esta comprobación un token cuya sesión ya se
        // liberó —navegador cerrado hace rato— seguiría abriendo el sistema
        // durante horas.
        const restante = state.activeSessionExpiresAt
            ? state.activeSessionExpiresAt.getTime() - Date.now()
            : 0;

        if (restante <= 0) {
            return res.status(401).json({
                message: "Tu sesión expiró. Vuelve a iniciar sesión.",
            });
        }

        // Renovación deslizante. El latido del frontend es la vía normal de
        // mantener viva la sesión, pero una pestaña en segundo plano puede ver
        // sus temporizadores frenados por el navegador. Mientras haya peticiones
        // —o sea, mientras alguien esté usando el sistema de verdad— la sesión no
        // puede caducar bajo sus pies.
        //
        // No se renueva en cada petición: eso sería una escritura por petición.
        // Solo cuando ya se consumió más de la mitad de la ventana.
        if (restante < VENTANA_SESION_MS * UMBRAL_RENOVACION) {
            await authRepository.touchActiveSession(
                decoded.id,
                new Date(Date.now() + VENTANA_SESION_MS),
            );
        }

        // (p48) Contraseña temporal sin cambiar: el resto del sistema queda cerrado.
        // 403 y no 401 a propósito — el token es válido y la sesión también, así que
        // un 401 haría que el interceptor del frontend cerrara la sesión y devolviera
        // al login, justo lo contrario de lo que se busca.
        //
        // La ruta se compara sin query string: `originalUrl` la incluye.
        if (state.mustChangePassword) {
            const ruta = req.originalUrl.split("?")[0];
            if (!RUTAS_PERMITIDAS_SIN_CAMBIAR_CLAVE.includes(ruta)) {
                return res.status(403).json({
                    error: "Debes cambiar tu contraseña temporal antes de usar el sistema.",
                    mustChangePassword: true,
                });
            }
        }
    } catch (err) {
        return next(err);
    }

    req.user = decoded;

    next();
};
