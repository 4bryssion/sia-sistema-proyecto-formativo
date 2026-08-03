// Paso 2 de 3 del flujo de recuperación: ingresar el código recibido por correo.
//
// El correo llega por router state desde el paso 1 (nunca por la URL). Si alguien
// entra directo a esta ruta o recarga la página, no hay correo y se devuelve al
// paso 1: sin él no se puede verificar nada.

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input, Button, Alert } from "@/shared";
import { recoverCodeSchema } from "../schemas/recoverPasswordSchema.js";
import { forgotPassword, verifyResetCode } from "../services/authService.js";
import AuthCard from "./AuthCard.jsx";

// Anti-spam del reenvío: mismo criterio que tenía la vista anterior unificada
const RESEND_COOLDOWN_S = 30;

export default function VerifyCodeForm() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const email = state?.email;

    const [userCodeRecover, setUserCodeRecover] = useState("");
    const [errors, setErrors] = useState({});
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

    // Sin correo no hay nada que verificar (entrada directa a la URL o recarga)
    useEffect(() => {
        if (!email) navigate("/auth/recover-password", { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Descuenta el cooldown hasta 0 y habilita el reenvío
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    if (!email) return null;

    const handleChange = (e) => {
        setUserCodeRecover(e.target.value);
        setErrors({});
    };

    const handleResend = async () => {
        setCooldown(RESEND_COOLDOWN_S); // antes del await, para bloquear el doble clic
        try {
            Alert.loading("Reenviando código...");
            const data = await forgotPassword(email);
            Alert.close();
            Alert.success("Código reenviado", data.mensaje);
        } catch (error) {
            Alert.close();
            Alert.error("No se pudo reenviar el código", error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = recoverCodeSchema.safeParse({ userCodeRecover });
        if (!result.success) {
            setErrors({ userCodeRecover: result.error.issues[0].message });
            return;
        }

        try {
            Alert.loading("Verificando código...");
            const data = await verifyResetCode({ userEmail: email, userCodeRecover });
            Alert.close();
            // resetTicket viaja por router state — nunca por URL ni sessionStorage (§3, P39)
            navigate("/auth/reset-password", { state: { resetTicket: data.resetTicket } });
        } catch (error) {
            Alert.close();
            Alert.error("Código inválido", error.message);
            setErrors({ form: error.message });
        }
    };

    return (
        <AuthCard
            title="Recuperar Contraseña"
            description="¡Ingrese el código de recuperación que recibió por correo!"
            highlight="Si el correo está registrado, recibirás un código de 6 dígitos."
            backTo="/auth/recover-password"
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col gap-4 w-[320px]">
                <Input
                    label="Código de recuperación"
                    name="userCodeRecover"
                    placeholder="Ingrese el código de 6 dígitos"
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={userCodeRecover}
                    onChange={handleChange}
                    error={errors.userCodeRecover}
                />

                {errors.form && (
                    <p className="font-secondary text-caption text-error text-center">
                        {errors.form}
                    </p>
                )}

                {/* type="button" explícito: dentro de un <form> el default es submit
                    y dispararía la verificación en vez del reenvío */}
                <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="justify-self-center"
                    disabled={cooldown > 0}
                    onClick={handleResend}
                >
                    {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
                </Button>
            </div>

            <div className="flex items-center justify-center gap-6">
                <Button variant="primary" size="md" type="submit">
                    Confirmar
                </Button>
            </div>
        </AuthCard>
    );
}
