import { useState, useEffect, useCallback, useRef } from "react";
import notificationService from "@/shared/services/notificationService";
import { onSessionChange, getToken } from "@/shared/services/authStorage";

// Cada cuánto se vuelve a preguntar si hay algo nuevo. Un minuto: lo bastante
// pronto para que un préstamo recién hecho se note, y lo bastante espaciado para
// no convertir la campana en una petición por segundo.
const REVISION_MS = 60 * 1000;

/**
 * (p50) Estado del punto verde de la campana.
 *
 * Se consulta al montar, cada minuto y cada vez que la pestaña vuelve a primer
 * plano —que es justo cuando alguien regresa y quiere saber si pasó algo—, y no
 * cuando está oculta: una pestaña de fondo no necesita avisar de nada.
 */
export function useUnreadNotifications(activo = true) {
  const [hayNuevas, setHayNuevas] = useState(false);
  // Evita que una respuesta lenta pise a una más reciente.
  const vigente = useRef(0);

  const revisar = useCallback(async () => {
    if (!activo || !getToken()) return;
    const marca = ++vigente.current;
    try {
      const { hayNuevas: nuevas } = await notificationService.getUnread();
      if (marca === vigente.current) setHayNuevas(!!nuevas);
    } catch {
      // Un fallo al consultar la campana no debe ensuciar la pantalla con una
      // alerta: simplemente no se enciende el punto hasta la próxima revisión.
    }
  }, [activo]);

  useEffect(() => {
    if (!activo) return;
    // La primera consulta sale fuera del cuerpo del efecto. `revisar` es
    // asíncrona y su setState ocurre después del await, pero la regla
    // react-hooks/set-state-in-effect no puede saberlo y marca la llamada
    // directa. Aplazarla un microtask dice lo mismo y lo dice explícito.
    queueMicrotask(revisar);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") revisar();
    }, REVISION_MS);
    const alVolver = () => { if (document.visibilityState === "visible") revisar(); };
    document.addEventListener("visibilitychange", alVolver);
    // Si la sesión cambia (entra otra persona, o se cierra), el punto se apaga y
    // se vuelve a preguntar por quien esté ahora.
    const desuscribir = onSessionChange(() => { setHayNuevas(false); revisar(); });
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
      desuscribir?.();
    };
  }, [activo, revisar]);

  /** Lo llama la pantalla de notificaciones al abrirse. */
  const apagar = useCallback(() => setHayNuevas(false), []);

  return { hayNuevas, revisar, apagar };
}
