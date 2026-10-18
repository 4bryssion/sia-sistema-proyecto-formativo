import { useEffect, useState } from "react";
import { Headset, Mail, SquarePen, Check, X } from "lucide-react";
import { IconButton } from "./IconButton";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { Alert } from "./utils/alert";
import settingService from "@/shared/services/settingService";

// (p53) El correo de soporte dejó de ser una constante del frontend: es un
// ajuste del sistema (`system_settings.support_email`) que se edita desde «Mi
// perfil» y que esta misma pantalla lee en el login, donde no hay sesión.
//
// Este valor solo se usa mientras la petición está en vuelo o si falla: el modal
// lo abre justamente quien no puede entrar al sistema, así que tiene que mostrar
// algo a quien escribir en vez de un hueco.
const CORREO_DE_RESPALDO = "superadmin@sia.local";

/**
 * Botón de contacto con soporte.
 *
 * Se usa en dos pantallas, y por eso vive en shared:
 * - Login (AuthLoginForm): flotando sobre el fondo oscuro, con variant="onColor".
 *   Pensado para quien NO tiene cuenta o no puede entrar, que es justo quien no
 *   puede pedir ayuda desde dentro del sistema.
 * - Mi perfil (ViewUserModal): junto a la insignia de Activo/Inactivo, y SOLO
 *   cuando es el perfil propio: si un administrador está viendo la ficha de otra
 *   persona, no tiene sentido ofrecerle soporte "sobre esa cuenta".
 *
 * (p53) `permitirEditar` enciende el lápiz para cambiar el correo. Lo decide
 * quien monta el componente, no el componente: solo se enciende desde «Mi
 * perfil» con la sesión iniciada y con el permiso `edit_support_email`. En el
 * login nunca, aunque el backend lo volvería a rechazar de todas formas.
 */
export default function SupportContactButton({
    // "onColor": para fondos oscuros o con degradado (la tarjeta del login).
    // "default": para fondos claros.
    variant = "default",
    className = "",
    // (p53) ¿Se puede cambiar el correo desde aquí?
    permitirEditar = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [correo, setCorreo] = useState(CORREO_DE_RESPALDO);
    const [editando, setEditando] = useState(false);
    const [borrador, setBorrador] = useState("");
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    // Se pide al abrir y no al montar: el botón vive en pantallas que se abren
    // mucho y el correo solo hace falta cuando alguien mira el modal. Así
    // también se ve el cambio recién hecho desde otra pantalla sin recargar.
    useEffect(() => {
        if (!isOpen) return;
        let vigente = true;
        settingService.getSupportEmail()
            .then((valor) => { if (vigente && valor) setCorreo(valor); })
            .catch(() => {});
        return () => { vigente = false; };
    }, [isOpen]);

    const abrirEdicion = () => {
        setBorrador(correo);
        setError("");
        setEditando(true);
    };

    const guardar = async () => {
        const valor = borrador.trim().toLowerCase();
        // Comprobación de forma aquí y validación real en el backend: lo de aquí
        // es para no hacer un viaje que ya se sabe que va a fallar.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
            setError("Escribe un correo válido, por ejemplo soporte@sena.edu.co");
            return;
        }
        setGuardando(true);
        try {
            const guardado = await settingService.updateSupportEmail(valor);
            setCorreo(guardado);
            setEditando(false);
            Alert.success(
                "Correo de soporte actualizado",
                "Es el que verá quien abra el soporte desde el inicio de sesión.",
            );
        } catch (err) {
            Alert.error(
                "No se pudo actualizar el correo de soporte",
                err.response?.data?.detalles?.join(" · ")
                    ?? err.response?.data?.error
                    ?? "Inténtalo de nuevo en unos momentos.",
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <IconButton
                ariaLabel="Contactar a soporte"
                variant={variant}
                className={className}
                onClick={() => setIsOpen(true)}
            >
                <Headset strokeWidth={2.8} />
            </IconButton>

            <Modal
                isOpen={isOpen}
                onClose={() => { setIsOpen(false); setEditando(false); }}
                title="¿Necesitas ayuda?"
                size="sm"
            >
                <div className="flex flex-col items-center gap-4 text-center py-2">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-soft">
                        <Mail size={26} className="text-button-primary" />
                    </div>

                    <p className="font-secondary text-body text-text-primary">
                        Si tienes problemas para acceder o necesitas soporte,
                        escríbenos y con gusto te ayudamos.
                    </p>

                    {/* (p53) En modo lectura, el correo con su lápiz al lado;
                        en edición, el campo con guardar y cancelar. El enlace usa
                        el token de marca y no un azul suelto: el proyecto exige
                        que todo color salga de las variables. */}
                    {editando ? (
                        <div className="w-full flex flex-col items-center gap-3">
                            <Input
                                widthClass="w-full"
                                label="Correo de soporte"
                                name="supportEmail"
                                type="email"
                                value={borrador}
                                onChange={(e) => { setBorrador(e.target.value); setError(""); }}
                                error={error}
                            />
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setEditando(false)} disabled={guardando}>
                                    <X size={16} />
                                    Cancelar
                                </Button>
                                <Button variant="primary" size="sm" onClick={guardar} disabled={guardando}>
                                    <Check size={16} />
                                    {guardando ? "Guardando..." : "Guardar"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex items-center justify-center gap-1 min-w-0">
                            <a
                                href={`mailto:${correo}`}
                                className="font-secondary text-body font-bold underline underline-offset-2 text-button-primary hover:text-button-primary-hover wrap-anywhere min-w-0"
                            >
                                {correo}
                            </a>

                            {permitirEditar && (
                                <IconButton
                                    ariaLabel="Editar el correo de soporte"
                                    hitSize={36}
                                    iconSize={18}
                                    onClick={abrirEdicion}
                                >
                                    <SquarePen strokeWidth={2.4} />
                                </IconButton>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
