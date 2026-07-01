// src/shared/services/authStorage.js
// Helper de sesión: lee el usuario autenticado guardado en sessionStorage.
// Se guarda en el login (AuthLoginForm.jsx) junto al token y se limpia en logout
// (logoutService.js). No hace requests — solo lee sessionStorage["user"].

export function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
