import api from "@/shared/services/axiosInstance";

const groupService = {
  async getAll()        { const { data } = await api.get("/groups");                return data; },
  async getById(id)     { const { data } = await api.get(`/groups/${id}`);          return data; },
  async create(payload) { const { data } = await api.post("/groups", payload);      return data; },
  async update(id, p)   { const { data } = await api.put(`/groups/${id}`, p);       return data; },
  async toggle(id)      { const { data } = await api.patch(`/groups/${id}/toggle`); return data; },

  async assignPermission(groupId, permissionId) {
    const { data } = await api.post(`/groups/${groupId}/permissions`, { permissionId });
    return data;
  },
  async removePermission(groupId, permissionId) {
    const { data } = await api.delete(`/groups/${groupId}/permissions/${permissionId}`);
    return data;
  },
};

export default groupService;
