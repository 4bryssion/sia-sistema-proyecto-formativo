import Swal from "sweetalert2";

// ============ Utilidad central de alertas (SweetAlert2) ============
// Reglas del proyecto:
// - PROHIBIDO el rojo: errores usan "!" (círculo amarillo) y warnings el
//   triángulo amarillo con "!" en el medio.
// - Alertas informativas (success/error simple) se cierran solas en 4~6s con
//   barra de progreso visible (timerProgressBar) para intuir el cierre.
// - warning/confirm exigen respuesta del usuario (sin auto-cierre, sin click afuera).

const AUTO_CLOSE_MS = 3500; // cierre automático (se redujo ~1.5s a pedido)

// Estilos personalizados que vienen de global.css (@layer utilities)
const baseConfig = {
  customClass: {
    popup: "swal-popup",
    title: "swal-title",
    htmlContainer: "swal-content",
    confirmButton: "swal-btn-confirm",
    cancelButton: "swal-btn-cancel",
    actions: "swal-actions",
  },
  buttonsStyling: false,
};

// Triángulo amarillo con "!" (lucide triangle-alert) para warnings/confirm de riesgo
const WARNING_TRIANGLE_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"
       fill="none" stroke="var(--color-tertiary-950)" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>`;

export const Alert = {
  // Éxito: informativa → se cierra sola con barra de progreso (también se puede Aceptar)
  success: (title, text = "") =>
    Swal.fire({
      ...baseConfig,
      icon: "success",
      iconColor: "var(--color-primary-950)",
      title,
      text,
      confirmButtonText: "Aceptar",
      reverseButtons: true,
      timer: AUTO_CLOSE_MS,
      timerProgressBar: true,
    }),

  // Error: círculo amarillo con "!" (icon warning de swal; prohibido el rojo).
  // Requiere "Entendido" — un error no debe cerrarse sin que el usuario lo lea
  error: (title, text = "") =>
    Swal.fire({
      ...baseConfig,
      icon: "warning",
      iconColor: "var(--color-tertiary-950)",
      title,
      text,
      confirmButtonText: "Entendido",
      reverseButtons: true,
    }),

  // Advertencia con decisión (ej. desactivar algo): triángulo amarillo con "!".
  // El usuario SÍ o SÍ confirma o cancela
  warning: async (title, text = "") => {
    const result = await Swal.fire({
      ...baseConfig,
      iconHtml: WARNING_TRIANGLE_HTML,
      customClass: { ...baseConfig.customClass, icon: "swal-icon-plain" },
      title,
      text,
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      allowOutsideClick: false,
    });
    return result;
  },

  // Confirmación neutra (ej. cerrar sesión, enviar datos): el usuario decide
  confirm: async (title, text = "") => {
    const result = await Swal.fire({
      ...baseConfig,
      icon: "question",
      iconColor: "var(--color-secondary-950)",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      allowOutsideClick: false,
    });
    return result;
  },

  // Carga para peticiones asíncronas (login, creación, envío de correos...).
  // No tiene botón de cierre a propósito: se cierra con Alert.close() al responder
  loading: (title = "Cargando...", text = "") =>
    Swal.fire({
      ...baseConfig,
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    }),

  close: () => Swal.close(),
};
