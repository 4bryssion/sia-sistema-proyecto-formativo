import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/axiosInstance";
import { getCurrentUser, getCurrentUserName, setCurrentUserName } from "../services/authStorage";

/**
 * Permission Gate — RBAC dinámico con autorización basada en permisos.
 *
 * Los permisos NO se deducen del nombre del rol: se consultan al backend
 * (`GET /api/access/me/permissions`), que los resuelve desde la BD
 * (permisos directos + los de sus grupos; SuperAdmin recibe el catálogo completo).
 *
 * La UI solo oculta/deshabilita; la autorización real la impone el backend
 * (middleware `requirePermission`) — defensa en profundidad.
 */
const PermissionsContext = createContext({ permissions: [], can: () => false, loading: true });

export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    // Sin token no hay nada que consultar (rutas públicas como la firma de préstamos)
    if (!sessionStorage.getItem("token")) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/access/me/permissions");
      setPermissions(data.permissions ?? []);
    } catch {
      // Ante un fallo de red no se bloquea la UI a ciegas: el backend sigue
      // siendo quien autoriza cada petición
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  // Resuelve el nombre completo del usuario autenticado y lo cachea en
  // sessionStorage. Se hace aquí porque este provider ya envuelve /dashboard y
  // /view y corre una sola vez por sesión; los encabezados de los reportes lo
  // leen después de forma síncrona. GET /users/:id con el propio id está
  // permitido sin list_users (excepción documentada de "Mi perfil").
  useEffect(() => {
    const id = getCurrentUser()?.id;
    if (!id || getCurrentUserName()) return;
    api.get(`/users/${id}`)
      .then(({ data }) => setCurrentUserName(`${data.userFirstName} ${data.userLastName}`.trim()))
      // Sin nombre el reporte cae al correo: no vale la pena molestar al usuario
      .catch(() => {});
  }, []);

  // can("list_users") · can(["create_loan", "edit_loan"]) → true si tiene ALGUNO
  const can = useCallback(
    (codename) => {
      if (!codename) return true;
      const list = Array.isArray(codename) ? codename : [codename];
      return list.some((c) => permissions.includes(c));
    },
    [permissions]
  );

  return (
    <PermissionsContext.Provider value={{ permissions, can, loading, refetch: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionsContext);
