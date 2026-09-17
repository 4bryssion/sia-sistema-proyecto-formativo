import api from "@/shared/services/axiosInstance";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

const userService = {
  async getAll(status)   { const { data } = await api.get("/users", { params: status ? { status } : {} }); return data; },
  async getById(id)      { const { data } = await api.get(`/users/${id}`); return data; },
  async create(formData) { const { data } = await api.post("/users", formData, multipart); return data; },
  async update(id, fd)   { const { data } = await api.put(`/users/${id}`, fd, multipart); return data; },

  // (p48) El toggle dejó de tener el body vacío:
  //   desactivar → sin body (el backend adelanta la fecha de fin a hoy si era futura)
  //   reactivar  → { userStartDate, userEndDate } OBLIGATORIO; sin ellas responde 400
  async toggle(id, fechas) { const { data } = await api.patch(`/users/${id}/toggle`, fechas ?? {}); return data; },
};

export default userService;
