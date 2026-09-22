import api from "@/shared/services/axiosInstance";

// (p50) Vive en shared y no dentro del módulo de notificaciones porque lo usan
// DOS sitios: la pantalla de notificaciones y la campana del Navbar, que es un
// componente compartido. Un módulo no puede importar de otro, así que lo común
// sube aquí.
//
// Ninguna ruta recibe un id de usuario: el backend las resuelve con el token.
const notificationService = {
  /** Lo que le corresponde ver a quien pregunta. */
  async getAll() {
    const { data } = await api.get("/notifications");
    return data;
  },

  /** { hayNuevas, nuevas } — enciende o apaga el punto verde de la campana. */
  async getUnread() {
    const { data } = await api.get("/notifications/unread");
    return data;
  },

  /** Apaga el punto verde: marca el momento en que se abrieron. */
  async markSeen() {
    const { data } = await api.post("/notifications/seen");
    return data;
  },
};

export default notificationService;
