import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logos/logo-sena-verde.png";



import { Input, 
    Button, Alert, SupportContactButton } from "@/shared";

import { authSchema } from "../schemas/authSchema.js";
import { login } from "@/shared/services/authService";
import { askOtherTabsForSession } from "@/shared/services/sessionChannel.js";
import { setMustChangePassword } from "@/shared/services/authStorage";

export default function AuthRegisterForm(){

    // Constantes:
    
    const navigate = useNavigate();

    // Estados:

    const [formData, setFormData] = useState({
        userEmail: "",
        userPassword: "",
    });

    const [errors, setErrors] = useState({})

    // ===========================================
    //                 Handles
    // ===========================================
    // Función que se ejecuta cada vez que cambia el valor de un input del formulario

    // Handle genérico:

    const handleChange = (e) => {
        // Se obtiene el nombre del campo y su valor
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            // Se copian todos los valores anteriores del estado
            ...prev,

            // Se actualiza únicamente lo que cambió
            [name]: type === "chechbox" ? checked : value,
        }));
    }

    // Handles personalizados:
    
    // Función que se ejecuta cuando se envía el formulario 
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Se valida el objeto de formData usando el esquema definido con Zod
        // safeParse devuelve un objeto indicando si la validacion fue exitosa o no
        const result = authSchema.safeParse(formData);

        // Si la validación falla
        if (!result.success){
            // Objeto donde se almacenarán los errores por campo
            const fieldErrors = {};

            // Zod devuelve los errores en un arreglo llamado issues
            // Se recorren para asociar cada error a su campo correspondiente
            result.error.issues.forEach((issue) => {
                // Issue.path contiene la ruta del campo que falló
                const field = issue.path[0];

                // Se guarda el mensaje de error en el objeto fieldErrors
                fieldErrors[field] = issue.message;
            });

            // Se actualiza el estado de errores para mostrarlos en el formulario
            setErrors(fieldErrors);

            // Se detiene la ejecución porque el formulario tiene errores
            return;
        }

        // Si la validación es exitosa se limpian los errores anteriores
        setErrors({});

        // Sesión única dentro del mismo navegador (p45): el backend no puede ver
        // este caso cuando se inicia sesión con OTRO usuario en una pestaña
        // duplicada (cada usuario tiene su propio jti, no hay conflicto para él).
        // Se pregunta a las demás pestañas antes de enviar las credenciales.
        const otherTab = await askOtherTabsForSession();
        if (otherTab.active) {
            const msg = otherTab.email
                ? `Ya tienes una sesión iniciada en otra pestaña de este navegador con la cuenta ${otherTab.email}. Ciérrala antes de ingresar con otra.`
                : "Ya tienes una sesión iniciada en otra pestaña de este navegador. Ciérrala antes de ingresar con otra.";
            Alert.error("Sesión ya iniciada", msg);
            return;
        }

        try {
            Alert.loading("Iniciando sesión...");
            const data =  await login(result.data)

            sessionStorage.setItem("token", data.token); // Clave
            sessionStorage.setItem("user", JSON.stringify(data.user)); // { id, email } — usado por Navbar para "Mi perfil"

            // (p48) Contraseña temporal del primer inicio de sesión. Mientras el
            // flag esté activo el backend responde 403 en TODO el API salvo
            // change-password y logout, así que RequirePasswordChange superpone
            // el modal de cambio en cuanto se entra al dashboard.
            setMustChangePassword(!!data.mustChangePassword);

            Alert.close();
            navigate("/dashboard");
        } catch (error) {
            Alert.close();
            // 409: credenciales correctas pero la cuenta ya tiene sesión abierta
            // en otro navegador o dispositivo (sesión única, p45)
            Alert.error(
                error.status === 409 ? "Sesión ya iniciada" : "Error al iniciar sesión",
                error.message,
            );
        }
    };


    return(
        <div className="flex min-h-screen items-center justify-center">
            <form
                className="grid gap-6 mx-6 p-8 sm:p-12 justify-items-center max-w-max  bg-white border rounded-md"
                onSubmit={handleSubmit}
            >
                {/* Presentación del software: va arriba del logo, con las variables
                    de tipografía del proyecto (font-main + text-body) */}
                <p className="font-main text-h2 font-heading text-center text-text-primary max-w-[320px]">
                    S.I.I - Software de Inventario de Infraestructura
                </p>

                <img src={logo} alt="logo" className="h-24"/>
                <h1 className="text-h3 font-main">
                    Inicio de Sesión
                </h1>
                <div className="flex flex-col gap-6 w-[320px]">
                    <Input
                        label="Correo"
                        name="userEmail"
                        placeholder="Ingrese su correo"
                        type="email"
                        value={formData.userEmail}
                        onChange={handleChange}
                        error={errors.userEmail}
                    />

                    <Input
                        label="Contraseña"
                        name="userPassword"
                        placeholder="Ingrese su contraseña"
                        type="password"
                        value={formData.userPassword}
                        onChange={handleChange}
                        error={errors.userPassword}
                    />
                </div>

                <div className="flex items-center justify-center gap-6">

                    <Button variant="primary" size="md" type="submit">
                        Iniciar Sesión
                    </Button>

                </div>

                <Link className="font-secondary text-small underline text-button-primary hover:text-button-primary-hover" to="/auth/recover-password">
                    ¿Olvidó su contraseña?
                </Link>

                {/* Soporte en el login: es justo aquí donde está quien NO puede
                    entrar y por tanto no puede pedir ayuda desde dentro */}
                <div className="flex items-center gap-2">
                    <SupportContactButton />
                    <span className="font-secondary text-small text-text-muted">
                        ¿Necesitas ayuda?
                    </span>
                </div>
                
            </form>
        </div>
    )
}