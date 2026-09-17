import api from "@/shared/services/axiosInstance";

const taskService = {
  async getAll()        { const { data } = await api.get("/tasks");                return data; },
  // Tareas de un solo usuario (usado por "Ver mis tareas" desde Mi Perfil)
  async getByUser(userId) { const { data } = await api.get(`/tasks/user/${userId}`); return data; },
  async getById(id)     { const { data } = await api.get(`/tasks/${id}`);          return data; },
  async create(payload) { const { data } = await api.post("/tasks", payload);      return data; },
  async update(id, p)   { const { data } = await api.put(`/tasks/${id}`, p);       return data; },
  async toggle(id)      { const { data } = await api.patch(`/tasks/${id}/toggle`); return data; },
};

export default taskService;
