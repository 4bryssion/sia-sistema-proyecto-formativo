import api from "@/shared/services/axiosInstance";

// Solo lectura: las notificaciones las genera el backend (logs del sistema)
const notificationService = {
  async getAll()    { const { data } = await api.get("/notifications");        return data; },
  async getById(id) { const { data } = await api.get(`/notifications/${id}`);  return data; },
};

export default notificationService;
