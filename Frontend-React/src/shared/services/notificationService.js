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

  /**
   * { hayNuevas, nuevas } — enciende o apaga el punto verde de la campana.
   *
   * (p51) Silenciosa: la dispara la campana sola, al montar y cada minuto, sin
   * que nadie la pida. Si el servidor la rechaza, el punto no se enciende y ya
   * está; lo que no puede es abrirle un modal al usuario encima del dashboard
   * por una pregunta que él no hizo.
   */
  async getUnread() {
    const { data } = await api.get("/notifications/unread", { silencioso: true });
    return data;
  },

  /** Apaga el punto verde: marca el momento en que se abrieron. */
  // (p52) Igual que `getUnread`: corre al abrir la pantalla, sin que nadie la
  // pida, asi que su fallo no puede abrir un modal. El `.catch` de quien la
  // llama no bastaba: el interceptor se ejecuta antes.
  async markSeen() {
    const { data } = await api.post("/notifications/seen", null, { silencioso: true });
    return data;
  },
};

export default notificationService;
