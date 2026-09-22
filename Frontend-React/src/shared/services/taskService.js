import api from "@/shared/services/axiosInstance";

const taskService = {
  // (p50) `status` es el estado del REGISTRO: "active" | "inactive" | "all".
  async getAll(status = "active") { const { data } = await api.get("/tasks", { params: { status } }); return data; },
  // Tareas de un solo usuario: lo usa quien solo puede ver las suyas
  async getByUser(userId) { const { data } = await api.get(`/tasks/user/${userId}`); return data; },
  async getById(id)     { const { data } = await api.get(`/tasks/${id}`);          return data; },
  async create(payload) { const { data } = await api.post("/tasks", payload);      return data; },
  async update(id, p)   { const { data } = await api.put(`/tasks/${id}`, p);       return data; },
  // (p50) Solo el estado de la tarea. Va por su propia ruta porque exige otro
  // permiso: quien la tiene asignada puede decir si la hizo, pero no reescribirla.
  async setStatus(id, status) { const { data } = await api.patch(`/tasks/${id}/status`, { status }); return data; },
  async toggle(id)      { const { data } = await api.patch(`/tasks/${id}/toggle`); return data; },
};

export default taskService;
