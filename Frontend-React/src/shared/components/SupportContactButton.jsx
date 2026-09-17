import { useState } from "react";
import { Headset, Mail } from "lucide-react";
import { IconButton } from "./IconButton";
import Modal from "./Modal";

// Correo al que se dirige a quien necesita ayuda.
//
// ⚠️ PLACEHOLDER: hay que reemplazarlo por la cuenta de soporte real del centro
// antes de la sustentación. Vive como constante y no repartido por el JSX para
// que ese cambio sea una sola línea.
const SUPPORT_EMAIL = "superadmin@sia.local";

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
 */
export default function SupportContactButton({
    // "onColor": para fondos oscuros o con degradado (la tarjeta del login).
    // "default": para fondos claros.
    variant = "default",
    className = "",
}) {
    const [isOpen, setIsOpen] = useState(false);

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
                onClose={() => setIsOpen(false)}
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

                    {/* El enlace usa el token de marca y no un azul suelto: el
                        proyecto exige que todo color salga de las variables. */}
                    <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="font-secondary text-body font-bold underline underline-offset-2 text-button-primary hover:text-button-primary-hover break-all"
                    >
                        {SUPPORT_EMAIL}
                    </a>
                </div>
            </Modal>
        </>
    );
}
