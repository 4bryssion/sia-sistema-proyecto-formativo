import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logos/logo-sena-verde.png";



import { Input, 
    Button, Alert, SupportContactButton } from "@/shared";

import { authSchema } from "../schemas/authSchema.js";
import { login } from "@/shared/services/authService";
import { setMustChangePassword, setSession } from "@/shared/services/authStorage";

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

    // Envío real del login. Se mantiene aparte del handler porque el handler ya
    // carga con la validación y el aviso entre pestañas; aquí solo va el envío.
    const entrar = async (credenciales) => {
        Alert.loading("Iniciando sesión...");

        const data = await login(credenciales);

        // { id, email } — el Navbar lo usa para "Mi perfil"
        setSession(data.token, data.user);

        // (p48) Contraseña temporal del primer inicio de sesión. Mientras el
        // flag esté activo el backend responde 403 en TODO el API salvo
        // change-password y logout, así que RequirePasswordChange superpone
        // el modal de cambio en cuanto se entra al dashboard.
        setMustChangePassword(!!data.mustChangePassword);

        Alert.close();
        navigate("/dashboard");
    };

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

        // (p49) Ya no hace falta preguntar a las demás pestañas: con el token en
        // localStorage todas comparten UNA sesión, así que el caso que antes se
        // escapaba —dos pestañas con usuarios distintos— no puede darse. Si hay
        // otra sesión abierta en cualquier sitio, el backend responde 409.

        try {
            await entrar(result.data);
        } catch (error) {
            Alert.close();
            // 409: credenciales correctas pero la cuenta ya tiene una sesión
            // abierta (sesión única, p45). Puede ser en otro equipo, en otro
            // navegador o —lo más frecuente— en otra ventana de este mismo. El
            // texto que explica qué hacer lo pone el backend: aquí solo se le
            // da un título, para que no haya dos versiones del mismo mensaje.
            Alert.error(
                error.status === 409 ? "Sesión ya iniciada" : "Error al iniciar sesión",
                error.message,
            );
        }
    };


    return(
        // El conjunto (soporte + tarjeta) se centra verticalmente en la pantalla.
        // (p50) Sin relleno vertical desde lg: en pantallas anchas la tarjeta
        // cabe de sobra y el relleno solo servía para empujar el alto por encima
        // del alto de la ventana y sacar una barra de desplazamiento.
        <div className="flex min-h-screen items-center justify-center px-6 py-8 lg:py-0">

            {/* Móvil: columna — soporte primero y tarjeta después, que es el
                orden del DOM, sin reordenar por breakpoint.
                Desde sm: fila con `items-start`, así la fila mide lo que mide la
                tarjeta y el soporte queda a la ALTURA DE SU BORDE SUPERIOR, no
                arriba del todo de la pantalla. */}
            <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-0">

                {/* Soporte: texto a la IZQUIERDA del icono. Va fuera de la
                    tarjeta blanca a propósito — pertenece al fondo, no al
                    formulario. Desde sm pasa al extremo derecho (order-3). */}
                <div className="flex items-center justify-end gap-2 sm:order-3 sm:flex-1 sm:pl-3.5 md:pl-0">
                    <span className="font-secondary text-small text-text-inverse">
                        ¿Necesitas ayuda?
                    </span>
                    <SupportContactButton variant="onDark" />
                </div>

                {/* Hueco espejo del bloque de soporte. Sin él la tarjeta no
                    quedaría centrada en la pantalla, sino desplazada hacia la
                    izquierda por el ancho del soporte. Solo existe desde sm. */}
                <div className="hidden sm:order-1 sm:block sm:flex-1" aria-hidden="true" />
                {/* w-full + max-w: la tarjeta se encoge con la pantalla en vez
                    de desbordarla. Con el `max-w-max` anterior el ancho lo
                    fijaba el bloque de 320px de los campos y en un móvil de
                    360px el formulario se salía de la pantalla. */}
                <form
                    className="grid gap-6 w-full max-w-sm self-center p-8 sm:p-12 justify-items-center bg-white border rounded-md sm:order-2"
                    onSubmit={handleSubmit}
                >
                    {/* Presentación del software: va arriba del logo, con las variables
                        de tipografía del proyecto (font-main + text-body) */}
                    <p className="font-main text-h2 font-heading text-center text-text-primary">
                        S.I.I - Software de Inventario de Infraestructura
                    </p>

                    <img src={logo} alt="logo" className="h-24"/>
                    <h1 className="text-h3 font-main">
                        Inicio de Sesión
                    </h1>
                    <div className="flex flex-col gap-6 w-full">
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

                </form>
            </div>
        </div>
    )
}