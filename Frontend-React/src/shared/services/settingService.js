import api from "@/shared/services/axiosInstance";

// (p53) Ajustes del sistema. Hoy solo el correo de soporte.
const settingService = {
  // La lectura es PÚBLICA: la hace también el modal de soporte del login, donde
  // no hay sesión. `silencioso` para que un fallo de red no levante una alerta
  // encima de la pantalla de inicio de sesión: el modal cae al correo que ya
  // tenía y quien lo abre ve algo a quien escribir.
  async getSupportEmail() {
    const { data } = await api.get("/settings/support-email", { silencioso: true });
    return data.supportEmail;
  },

  // Exige el permiso `edit_support_email` en el backend.
  async updateSupportEmail(supportEmail) {
    const { data } = await api.put("/settings/support-email", { supportEmail });
    return data.data.supportEmail;
  },
};

export default settingService;
