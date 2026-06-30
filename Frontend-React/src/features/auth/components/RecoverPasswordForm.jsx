import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logos/logo-sena-verde.png";
import bg from "@/assets/images/background-oscuro.jpg";
import { Input, Button } from "@/shared";
import { recoverPasswordSchema } from "../schemas/recoverPasswordSchema.js";
import { Undo2 } from "lucide-react";

export default function RecoverPasswordForm() {

    const navigate = useNavigate();

    // Estado del formulario
    const [formData, setFormData] = useState({
        userEmail: "",
        userEmailConfirm: "",
    });

    const [errors, setErrors] = useState({});

    // Handle genérico para inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors.form) setErrors((prev) => ({ ...prev, form: undefined }));
    };

    // Handle submit con validación
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación con Zod
        const result = recoverPasswordSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                fieldErrors[field] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});

        try {
            // Aquí irá la llamada al backend para recuperar contraseña
            console.log("Recuperar contraseña:", result.data);
            alert("Se ha enviado un correo de restablecimiento.");
            navigate("/auth");

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

                {/* Inputs */}
                <div className="flex flex-col gap-6 w-[320px]">
                    <Input
                        label="Correo electrónico"
                        name="userEmail"
                        placeholder="Correo electrónico"
                        type="email"
                        value={formData.userEmail}
                        onChange={handleChange}
                        error={errors.userEmail || errors.form}
                    />
                    <Input
                        label="Confirmación correo"
                        name="userEmailConfirm"
                        placeholder="Confirmación correo"
                        type="email"
                        value={formData.userEmailConfirm}
                        onChange={handleChange}
                        error={errors.userEmailConfirm}
                    />
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