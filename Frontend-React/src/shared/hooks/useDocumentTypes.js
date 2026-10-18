import { useState, useEffect } from "react";
import documentTypeService from "@/shared/services/documentTypeService";

/**
 * (p51) Tipos de documento, ya en forma de opciones de Select.
 *
 * Estaba copiado con el mismo `.map()` en crear usuario y en editar usuario, y al
 * pedir el documento del receptor no registrado de un préstamo habría sido la
 * tercera copia.
 *
 * `enabled` existe porque los modales lo necesitan solo cuando están abiertos:
 * pedir la lista al montar la pantalla sería una petición por fila de la tabla.
 *
 * Un fallo deja la lista vacía en vez de romper el formulario: sin permiso para
 * listarlos el servidor responde 403, y una pantalla en blanco no explica nada.
 * El Select se verá sin opciones y el formulario no dejará continuar, que es el
 * comportamiento correcto.
 */
export function useDocumentTypes(enabled = true) {
    const [documentTypes, setDocumentTypes] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled) return;
        let vigente = true;
        documentTypeService.getAll()
            .then((dts) => {
                if (!vigente) return;
                setDocumentTypes(dts.map((d) => ({
                    id: d.id,
                    value: String(d.id),
                    label: d.documentName,
                })));
                setError(null);
            })
            .catch((err) => {
                if (!vigente) return;
                setDocumentTypes([]);
                setError(err.response?.data?.error ?? "Error al cargar los tipos de documento");
            });
        // El modal se puede cerrar antes de que llegue la respuesta: sin esto,
        // React avisa de un setState sobre un componente ya desmontado.
        return () => { vigente = false; };
    }, [enabled]);

    return { documentTypes, error };
}
