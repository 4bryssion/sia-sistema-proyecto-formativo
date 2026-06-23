import api from "@/shared/services/axiosInstance";

const brandService = {
  async getAll()        { const { data } = await api.get("/brands");                return data; },
  async getById(id)     { const { data } = await api.get(`/brands/${id}`);          return data; },
  async create(payload) { const { data } = await api.post("/brands", payload);      return data; },
  async update(id, p)   { const { data } = await api.put(`/brands/${id}`, p);       return data; },
  async toggle(id)      { const { data } = await api.patch(`/brands/${id}/toggle`); return data; },
};

export default brandService;
