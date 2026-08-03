// Paso 3 de 3 del flujo de recuperación: establecer la nueva contraseña.
// Comparte el marco visual con los pasos 1 y 2 a través de AuthCard.

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input, Button, Alert } from "@/shared";
import { resetPasswordSchema } from "../schemas/resetPasswordSchema.js";
import { resetPassword } from "../services/authService.js";
import AuthCard from "./AuthCard.jsx";

export default function ResetPasswordForm() {

    const navigate = useNavigate();
    const { state } = useLocation();
    const resetTicket = state?.resetTicket;

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    // Si se abre esta pantalla sin resetTicket (refresh, URL directa, etc.) → redirigir.
    // El return null previo evita renderizar el formulario antes de que el redirect ocurra.
    useEffect(() => {
        if (!resetTicket) {
            navigate("/auth/recover-password", { replace: true });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Navega automáticamente a /auth tras mostrar el mensaje de éxito
    useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => navigate("/auth"), 1500);
        return () => clearTimeout(timer);
    }, [successMessage, navigate]);

    if (!resetTicket) return null;

    // Handle genérico para inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors.form) setErrors((prev) => ({ ...prev, form: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = resetPasswordSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});

        try {
            Alert.loading("Actualizando contraseña...");
            const data = await resetPassword({ resetTicket, newPassword: result.data.newPassword });
            Alert.close();
            const msg = data.mensaje ?? "Contraseña actualizada correctamente.";
            Alert.success("Contraseña actualizada", msg);
            setSuccessMessage(msg);
        } catch (error) {
            Alert.close();
            Alert.error("Error al actualizar la contraseña", error.message);
            setErrors({ form: error.message });
        }
    };

    return (
        <AuthCard
            title="Nueva Contraseña"
            description="¡Ingrese su nueva contraseña para finalizar la recuperación!"
            backTo="/auth/recover-password"
            onSubmit={handleSubmit}
        >
            {/* Inputs — el ojo de mostrar/ocultar lo aporta el propio Input al ser type="password" */}
            <div className="flex flex-col gap-6 w-[320px]">
                <Input
                    label="Nueva contraseña"
                    name="newPassword"
                    placeholder="Nueva contraseña"
                    type="password"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    error={errors.newPassword}
                />
                <Input
                    label="Confirmar contraseña"
                    name="confirmPassword"
                    placeholder="Confirmar contraseña"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                />

                {errors.form && (
                    <p className="font-secondary text-caption text-error text-center">
                        {errors.form}
                    </p>
                )}

                {successMessage && (
                    <p className="font-secondary text-caption text-center text-(--color-primary-950)">
                        {successMessage}
                    </p>
                )}
            </div>

            {/* Botón */}
            <div className="flex items-center justify-center gap-6">
                <Button variant="primary" size="md" type="submit">
                    Confirmar
                </Button>
            </div>
        </AuthCard>
    );
}
