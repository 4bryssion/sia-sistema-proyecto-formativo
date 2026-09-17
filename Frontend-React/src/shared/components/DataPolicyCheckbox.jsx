import { useState } from "react";
import { FileText } from "lucide-react";
import Checkbox from "./Checkbox";
import Modal from "./Modal";
import Button from "./Button";

// Texto legal del tratamiento de datos personales. Literal del que entregó el
// centro: no se reescribe ni se resume, porque es la cláusula que la persona
// acepta.
const TEXTO_HABEAS_DATA =
    "De acuerdo con La Ley 1581 de 2012, Protección de Datos Personales, el Servicio " +
    "Nacional de Aprendizaje SENA, se compromete a garantizar la seguridad y protección " +
    "de los datos personales que se encuentran almacenados en este documento, y les dará " +
    "el tratamiento correspondiente en cumplimiento de lo establecido legalmente.";

const URL_HABEAS_DATA = "https://www.sena.edu.co/es-co/transparencia/Paginas/habeas_data.aspx";

/**
 * Tratamiento de datos personales (Ley 1581 de 2012).
 *
 * Dos formas de usarlo, porque aparece en dos sitios distintos:
 *
 * - `mode="checkbox"` (crear usuario): casilla con la frase de aceptación. El
 *   nombre de la ley es pulsable y abre el modal con el texto completo. Sin
 *   aceptar no se puede crear el usuario, así que la casilla ES el control.
 * - `mode="link"` (Mi perfil): solo el icono con etiqueta que abre el modal.
 *   Ahí no hay nada que aceptar —ya se aceptó al crear la cuenta—, solo consultar.
 *
 * Reutiliza `Checkbox` y `Modal` en vez de redibujarlos: es la misma casilla y el
 * mismo modal del resto del sistema.
 */
export default function DataPolicyCheckbox({
    mode = "checkbox",
    checked = false,
    onChange,
    error,
    id = "dataPolicyAccepted",
    name = "dataPolicyAccepted",
    className = "",
}) {
    const [isOpen, setIsOpen] = useState(false);

    const modal = (
        <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Tratamiento de datos personales"
            size="md"
        >
            <div className="flex flex-col gap-4">
                <p className="font-secondary text-body text-text-primary">
                    {TEXTO_HABEAS_DATA}
                </p>

                <a
                    href={URL_HABEAS_DATA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-secondary text-medium underline underline-offset-2 text-button-primary hover:text-button-primary-hover break-all"
                >
                    {URL_HABEAS_DATA}
                </a>

                <div className="flex justify-end pt-2">
                    <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
                        Entendido
                    </Button>
                </div>
            </div>
        </Modal>
    );

    if (mode === "link") {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className={`flex items-center gap-2 cursor-pointer font-secondary text-medium underline-offset-2 hover:underline ${className}`}
                >
                    <FileText size={18} strokeWidth={2.4} aria-hidden="true" />
                    Tratamiento de datos
                </button>
                {modal}
            </>
        );
    }

    return (
        <div className={className}>
            <div className="flex items-center gap-1 flex-wrap">
                <Checkbox
                    id={id}
                    name={name}
                    checked={checked}
                    onChange={onChange}
                    labelClassName="text-medium"
                    label="He leído y acepto los términos y condiciones"
                />
                {/* Fuera del <label> del Checkbox a propósito: dentro, pulsarlo
                    marcaría la casilla además de abrir el modal. */}
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="font-secondary text-medium underline underline-offset-2 cursor-pointer text-button-primary hover:text-button-primary-hover"
                >
                    (leer)
                </button>
            </div>

            {error && (
                <p className="font-secondary text-caption text-error mt-1">{error}</p>
            )}

            {modal}
        </div>
    );
}
