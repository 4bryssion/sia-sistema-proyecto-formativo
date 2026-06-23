import api from "@/shared/services/axiosInstance";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

const userService = {
  async getAll(status)   { const { data } = await api.get("/users", { params: status ? { status } : {} }); return data; },
  async getById(id)      { const { data } = await api.get(`/users/${id}`); return data; },
  async create(formData) { const { data } = await api.post("/users", formData, multipart); return data; },
  async update(id, fd)   { const { data } = await api.put(`/users/${id}`, fd, multipart); return data; },
  async toggle(id)       { const { data } = await api.patch(`/users/${id}/toggle`); return data; },
};

export default userService;
