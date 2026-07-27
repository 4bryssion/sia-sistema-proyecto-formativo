import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import logo from "@/assets/logos/logo-sena-verde.png";
import bg from "@/assets/images/background-oscuro.jpg";
import { Input, Button } from "@/shared";
import { recoverPasswordSchema } from "../schemas/recoverPasswordSchema.js";
import { forgotPassword, verifyResetCode } from "../services/authService.js";
import { Undo2 } from "lucide-react";

export default function RecoverPasswordForm() {

    const navigate = useNavigate();

    // Estado del formulario
    const [formData, setFormData] = useState({
        userEmail: "",
        userCodeRecover: "",
    });

    const [errors, setErrors] = useState({});

    // Anti-spam: segundos restantes antes de permitir otro "Enviar código"
    const [cooldown, setCooldown] = useState(0);

    // Mensaje que muestra la respuesta del backend tras pulsar "Enviar código"
    const [sendMessage, setSendMessage] = useState("");

    // Decrementa el cooldown cada segundo hasta llegar a 0
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    // Handle genérico para inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors.form) setErrors((prev) => ({ ...prev, form: undefined }));
    };

    // Valida solo el email y llama a forgotPassword; arranca el cooldown inmediatamente.
    // type="button" en el JSX es obligatorio: sin él, un <button> dentro de <form> es submit por
    // defecto y dispararía handleSubmit (verificar código) en lugar de este handler.
    const handleSendCode = async () => {
        const emailResult = z.string().email("Debe ingresar un email válido").safeParse(formData.userEmail);
        if (!emailResult.success) {
            setErrors((prev) => ({ ...prev, userEmail: emailResult.error.issues[0].message }));
            return;
        }
        setErrors((prev) => ({ ...prev, userEmail: undefined }));
        setSendMessage("");
        setCooldown(30); // arranca antes del await para bloquear doble clic
        try {
            const data = await forgotPassword(formData.userEmail);
            setSendMessage(data.mensaje);
        } catch (err) {
            setSendMessage(err.message);
        }
    };

    // Valida el formulario completo (email + código) y navega al paso de nueva contraseña
    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = recoverPasswordSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setSendMessage("");

        try {
            const data = await verifyResetCode(result.data);
            // resetTicket viaja por router state — nunca por URL ni sessionStorage (ver §3, P39)
            navigate("/auth/reset-password", { state: { resetTicket: data.resetTicket } });
        } catch (error) {
            setErrors({ form: error.message });
        }
    };

    return (
        // Contenedor con fondo igual al login
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
                onClick={() => navigate("/auth")}
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
                    Recuperar Contraseña
                </h1>

                {/* Descripción */}
                <p className="font-secondary text-body text-center max-w-xs">
                    ¡Ingrese su correo registrado para restablecer su contraseña!
                </p>

                {/* Inputs y botón de envío de código */}
                <div className="flex flex-col gap-4 w-[320px]">
                    <Input
                        label="Correo electrónico"
                        name="userEmail"
                        placeholder="Correo electrónico"
                        type="email"
                        value={formData.userEmail}
                        onChange={handleChange}
                        error={errors.userEmail}
                    />

                    {/* type="button" explícito — obligatorio para no disparar handleSubmit */}
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={cooldown > 0}
                        onClick={handleSendCode}
                    >
                        {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Enviar código"}
                    </Button>

                    {sendMessage && (
                        <p className="font-secondary text-caption text-center text-green-700">
                            {sendMessage}
                        </p>
                    )}

                    <Input
                        label="Código de recuperación"
                        name="userCodeRecover"
                        placeholder="Ingrese el código de 6 dígitos"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.userCodeRecover}
                        onChange={handleChange}
                        error={errors.userCodeRecover}
                    />

                    {errors.form && (
                        <p className="font-secondary text-caption text-error text-center">
                            {errors.form}
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