import { useState, useEffect, useCallback } from "react";
import brandService from "@/shared/services/brandService";
import inventoryService from "@/shared/services/inventoryService";
import userService from "@/shared/services/userService";

// Los tres catálogos que necesitan los CUATRO formularios de material (crear y
// editar × consumo y devolutivo): marcas, inventarios y cuentadantes. Estaba
// copiado en los cuatro, con el mismo filtro y el mismo mapeo a opciones.
//
// Los tres se piden SIN `status`, es decir solo los activos: un select de
// formulario no debe ofrecer algo dado de baja. Para que editar un material que
// ya apunta a una marca o un inventario desactivado no muestre el campo en
// blanco, está `ensureOption` más abajo.
//
// Ningún setState se llama de forma síncrona dentro del efecto: van todos dentro
// de las funciones asíncronas, que es lo que evita el render encadenado que
// marca la regla react-hooks/set-state-in-effect.

const opcionMarca     = (b) => ({ value: String(b.id), label: b.brandName });
const opcionInventario = (i) => ({ value: String(i.id), label: i.inventoryName });
const opcionUsuario   = (u) => ({
  value: String(u.id),
  label: `${u.userFirstName} ${u.userLastName}`,
});

/**
 * Devuelve las opciones con la selección actual incluida aunque ya no esté
 * activa, marcada para que se note. Sin esto, editar un material cuya marca se
 * desactivó después mostraría el select vacío y al guardar lo perdería.
 */
export const ensureOption = (options, id, label) => {
  if (!id) return options;
  const existe = options.some((o) => String(o.value) === String(id));
  if (existe || !label) return options;
  return [{ value: String(id), label: `${label} (inactivo)` }, ...options];
};

/**
 * Igual que ensureOption pero para la selección MÚLTIPLE de cuentadantes.
 * `asignados` son las filas que devolvió el material (con su `user` dentro).
 *
 * Sin esto, un cuentadante desactivado después de asignarse no aparecía en la
 * lista: el disparador mostraba su id crudo, no había casilla que desmarcar y al
 * guardar el backend lo rechazaba. El material quedaba imposible de editar.
 */
export const ensureOptions = (options, asignados = []) => {
  const faltantes = asignados
    .filter((a) => !options.some((o) => String(o.value) === String(a.userId ?? a.user?.id)))
    .map((a) => ({
      value: String(a.userId ?? a.user?.id),
      label: `${a.user?.userFirstName ?? ""} ${a.user?.userLastName ?? ""}`.trim() + " (inactivo)",
    }));
  return faltantes.length ? [...faltantes, ...options] : options;
};

export function useMaterialCatalogs(enabled = true) {
  const [brandOptions, setBrandOptions]             = useState([]);
  const [inventoryOptions, setInventoryOptions]     = useState([]);
  const [accountableOptions, setAccountableOptions] = useState([]);

  const fetchBrands = useCallback(async () => {
    try { setBrandOptions((await brandService.getAll()).map(opcionMarca)); }
    catch { /* el select queda vacío; el error del campo lo da el submit */ }
  }, []);

  const fetchInventories = useCallback(async () => {
    try { setInventoryOptions((await inventoryService.getAll()).map(opcionInventario)); }
    catch { /* idem */ }
  }, []);

  const fetchAccountables = useCallback(async () => {
    try {
      // El SADMIN ya viene excluido por el backend (systemIdentities.js): aquí
      // solo se acota a cuentadantes
      const users = await userService.getAll();
      setAccountableOptions(
        users.filter((u) => u.userAccountType === "Cuentadante").map(opcionUsuario),
      );
    } catch { /* idem */ }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Las tres van dentro de una función asíncrona y no sueltas en el cuerpo
    // del efecto: así ningún setState se ejecuta de forma síncrona al montar,
    // que es lo que encadena renders (react-hooks/set-state-in-effect).
    (async () => {
      await Promise.all([fetchBrands(), fetchInventories(), fetchAccountables()]);
    })();
  }, [enabled, fetchBrands, fetchInventories, fetchAccountables]);

  return {
    brandOptions,
    inventoryOptions,
    accountableOptions,
    refetchBrands: fetchBrands,
    refetchInventories: fetchInventories,
  };
}
