// Paso 1 de 3 del flujo de recuperación: solicitar el código.
//
// Antes esta vista hacía las tres cosas (pedir correo, enviar código y verificarlo),
// lo que saturaba la pantalla. Ahora cada paso es una ruta propia con su schema y su
// estado: /auth/recover-password → /auth/verify-code → /auth/reset-password.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Alert } from "@/shared";
import { recoverEmailSchema } from "../schemas/recoverPasswordSchema.js";
import { forgotPassword } from "../services/authService.js";
import AuthCard from "./AuthCard.jsx";

export default function RecoverPasswordForm() {
    const navigate = useNavigate();

    const [userEmail, setUserEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);

    const handleChange = (e) => {
        setUserEmail(e.target.value);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = recoverEmailSchema.safeParse({ userEmail });
        if (!result.success) {
            setErrors({ userEmail: result.error.issues[0].message });
            return;
        }

        setSending(true);
        try {
            Alert.loading("Enviando código...", "Revisa tu correo electrónico");
            await forgotPassword(result.data.userEmail);
            Alert.close();
            // El correo viaja por router state, nunca por la URL: no debe quedar en
            // el historial ni poder compartirse (mismo criterio que el resetTicket)
            navigate("/auth/verify-code", { state: { email: result.data.userEmail } });
        } catch (error) {
            Alert.close();
            Alert.error("No se pudo enviar el código", error.message);
            setErrors({ form: error.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <AuthCard
            title="Recuperar Contraseña"
            description="¡Ingrese su correo registrado para restablecer su contraseña!"
            backTo="/auth"
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col gap-4 w-[320px]">
                <Input
                    label="Correo electrónico"
                    name="userEmail"
                    placeholder="Correo electrónico"
                    type="email"
                    required
                    value={userEmail}
                    onChange={handleChange}
                    error={errors.userEmail}
                />

                {errors.form && (
                    <p className="font-secondary text-caption text-error text-center">
                        {errors.form}
                    </p>
                )}
            </div>

            {/* El botón solo existe cuando hay algo escrito: al borrar el correo
                desaparece (no se deshabilita, se desmonta) */}
            {userEmail.trim() !== "" && (
                <div className="flex items-center justify-center gap-6">
                    <Button variant="primary" size="md" type="submit" disabled={sending}>
                        {sending ? "Enviando..." : "Enviar código"}
                    </Button>
                </div>
            )}
        </AuthCard>
    );
}
