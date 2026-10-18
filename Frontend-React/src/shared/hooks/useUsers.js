import { useState, useEffect, useCallback } from "react";
import userService from "@/shared/services/userService";

/**
 * (p51) `activo` permite tenerlo apagado. Lo pide un modal cerrado: en React un
 * modal que recibe `isOpen={false}` SIGUE MONTADO —solo decide no dibujarse— y
 * sus hooks corren igual. Así, el modal de crear tarea pedía la lista de
 * usuarios nada más cargar la pantalla, sin que nadie lo hubiera abierto, y a
 * quien no puede listarlos el servidor le devolvía 403 con su alerta encima.
 *
 * Es la misma trampa del visor de imagen: lo que no se ve, igualmente se
 * ejecuta.
 */
export function useUsers(status = "active", activo = true) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(activo);
  const [error, setError]     = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!activo) return;
    setLoading(true);
    try {
      setUsers(await userService.getAll(status));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [status, activo]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}
