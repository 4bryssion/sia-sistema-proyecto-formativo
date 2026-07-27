import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logos/logo-sena-verde.png";
import bg from "@/assets/images/background-oscuro.jpg";
import { Input, Button } from "@/shared";
import { resetPasswordSchema } from "../schemas/resetPasswordSchema.js";
import { resetPassword } from "../services/authService.js";
import { Undo2 } from "lucide-react";

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
            const data = await resetPassword({ resetTicket, newPassword: result.data.newPassword });
            setSuccessMessage(data.mensaje ?? "Contraseña actualizada correctamente.");
        } catch (error) {
            setErrors({ form: error.message });
        }
    };

    return (
        // Mismo layout que RecoverPasswordForm — fondo, logo, botón volver, tarjeta blanca
        <div
            className="relative flex min-h-screen items-center justify-center"
        >
            {/* Fondo con imagen */}
            <div
                className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{ backgroundImage: `url(${bg})` }}
            />

            {/* Botón volver */}
            <button
                onClick={() => navigate("/auth/recover-password")}
                className="absolute top-6 left-6 flex items-center gap-2 text-white hover:opacity-80"
            >
                <Undo2 strokeWidth={2.8} />
            </button>

            <form
                className="grid gap-4 mx-6 p-8 sm:p-12 justify-items-center max-w-max bg-white border rounded-md my-8"
                onSubmit={handleSubmit}
            >
                {/* Logo SENA */}
                <img src={logo} alt="logo" className="h-24" />

                {/* Título */}
                <h1 className="text-h3 font-main font-bold">
                    Nueva Contraseña
                </h1>

                {/* Descripción */}
                <p className="font-secondary text-body text-center max-w-xs">
                    Ingresa tu nueva contraseña para finalizar la recuperación.
                </p>

                {/* Inputs */}
                <div className="flex flex-col gap-6 w-[320px]">
                    <Input
                        label="Nueva contraseña"
                        name="newPassword"
                        placeholder="Nueva contraseña"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        error={errors.newPassword}
                    />
                    <Input
                        label="Confirmar contraseña"
                        name="confirmPassword"
                        placeholder="Confirmar contraseña"
                        type="password"
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
                        <p className="font-secondary text-caption text-center text-green-700">
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

            </form>
        </div>
    );
}
