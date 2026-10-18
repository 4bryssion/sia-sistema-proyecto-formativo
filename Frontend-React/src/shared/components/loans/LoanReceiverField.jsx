import { Input, Select, Checkbox } from "@/shared";
import { useDocumentTypes } from "@/shared/hooks/useDocumentTypes";

/**
 * (p48) Quién recibe el préstamo: un usuario del sistema o alguien de fuera.
 *
 * La casilla MARCADA significa que SÍ está registrado (es el caso normal, así
 * que el formulario arranca marcada). Al desmarcarla, el select de usuarios se
 * sustituye por un campo de correo: a esa dirección viaja el enlace de firma.
 *
 * El backend lo expresa como un `xor`: se manda `receiverId` o `receiverEmail`,
 * nunca los dos ni ninguno. Por eso aquí solo se renderiza uno de los dos: dejar
 * el otro oculto pero con valor haría que el formulario mandara ambos.
 *
 * Vive en shared porque lo usan el formulario de crear y el modal de editar.
 *
 * (p51) Del receptor NO registrado se piden además su tipo y su número de
 * documento. El correo sirve para mandarle el enlace de firma, pero no
 * identifica a nadie: si el material no vuelve, «pedro@gmail.com» no dice a
 * quién reclamar. Los dos campos solo existen en esta rama; con un receptor
 * registrado el backend los RECHAZA, porque su documento ya está en su ficha y
 * aceptarlos aquí permitiría guardarle uno distinto.
 *
 * Ojo con el correo: si pertenece a alguien que SÍ está registrado, el backend
 * responde 400 diciendo de quién es y pidiendo que se elija de la lista. Ese
 * texto se muestra tal cual en la alerta (regla del proyecto), así que aquí no
 * se intenta adivinarlo por adelantado.
 */
export default function LoanReceiverField({
    registered,
    receiverId,
    receiverEmail,
    receiverDocumentTypeId = "",
    receiverDocumentNumber = "",
    userOptions,
    onChange,
    errors = {},
    idCasilla = "receiverRegistered",
}) {
    // Solo hacen falta con receptor externo, pero un hook no puede ir dentro de
    // un `if`: se le pasa la condición y es él quien decide si pide la lista.
    const { documentTypes } = useDocumentTypes(!registered);

    return (
        <div className="flex flex-col gap-3">
            <Checkbox
                id={idCasilla}
                name="receiverRegistered"
                label="¿El usuario receptor está registrado?"
                checked={registered}
                onChange={onChange}
            />

            {registered ? (
                <Select
                    label="Receptor"
                    variant="search"
                    name="receiverId"
                    required
                    options={userOptions}
                    value={receiverId}
                    onChange={onChange}
                    error={errors.receiverId}
                />
            ) : (
                <>
                <Input
                    label="Correo del receptor"
                    name="receiverEmail"
                    required
                    type="email"
                    placeholder="Ej: persona@empresa.com"
                    title="A este correo llegará el enlace para firmar el préstamo"
                    value={receiverEmail}
                    // Se normaliza al escribir: el backend comprueba si el correo
                    // pertenece a alguien ya registrado con una búsqueda exacta, y
                    // Postgres distingue mayúsculas. Sin esto, "Juan@Sena.edu.co"
                    // se saltaba ese aviso y quedaba guardado con mayúsculas.
                    onChange={(e) =>
                        onChange({
                            target: {
                                name: "receiverEmail",
                                value: e.target.value.trim().toLowerCase(),
                            },
                        })
                    }
                    error={errors.receiverEmail}
                />

                <Select
                    label="Tipo de documento"
                    variant="search"
                    name="receiverDocumentTypeId"
                    required
                    options={documentTypes}
                    value={receiverDocumentTypeId}
                    onChange={onChange}
                    error={errors.receiverDocumentTypeId}
                />

                <Input
                    label="Número de documento"
                    name="receiverDocumentNumber"
                    required
                    inputMode="numeric"
                    placeholder="Ej: 1094123456"
                    title="Con qué documento se identifica quien recibe el material"
                    value={receiverDocumentNumber}
                    onChange={onChange}
                    error={errors.receiverDocumentNumber}
                />
                </>
            )}
        </div>
    );
}
