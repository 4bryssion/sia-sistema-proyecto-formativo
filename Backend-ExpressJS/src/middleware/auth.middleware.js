import jwt from "jsonwebtoken";
import { authRepository } from "../features/auth/auth.repository.js";

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
    } catch (err) {
        return next(err);
    }

    req.user = decoded;

    next();
};
