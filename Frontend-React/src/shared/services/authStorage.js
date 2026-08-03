// src/shared/services/authStorage.js
// Helper de sesión: lee el usuario autenticado guardado en sessionStorage.
// Se guarda en el login (AuthLoginForm.jsx) junto al token y se limpia en logout
// (logoutService.js). No hace requests — solo lee sessionStorage.

export function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Clave donde se cachea el nombre completo del usuario autenticado.
//
// El login solo devuelve { id, email } — así está fijado el contrato en
// CLAUDE.md §3.1 y no se toca. Pero los encabezados de los reportes deben
// identificar al usuario generador con su nombre, no con su correo. En vez de
// pedir el usuario cada vez que se genera un reporte (y volver asíncrona toda la
// generación), se resuelve UNA vez al entrar al dashboard y se cachea aquí.
const NAME_KEY = "userName";

/** Nombre completo del usuario autenticado; null si aún no se ha resuelto */
export function getCurrentUserName() {
  return sessionStorage.getItem(NAME_KEY) || null;
}

export function setCurrentUserName(name) {
  if (name) sessionStorage.setItem(NAME_KEY, name);
}

export function clearCurrentUserName() {
  sessionStorage.removeItem(NAME_KEY);
}

/** Nombre completo si está cacheado; si no, el correo. Nunca vacío. */
export function getCurrentUserLabel() {
  return getCurrentUserName() ?? getCurrentUser()?.email ?? "—";
}
