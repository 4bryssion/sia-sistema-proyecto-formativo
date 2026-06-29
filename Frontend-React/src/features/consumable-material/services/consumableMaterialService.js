import api from "@/shared/services/axiosInstance";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

const consumableMaterialService = {
  async getAll(status) {
    const { data } = await api.get("/consumable-materials", {
      params: status ? { status } : {},
    });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/consumable-materials/${id}`);
    return data;
  },

  async create(formData) {
    const { data } = await api.post("/consumable-materials", formData, multipart);
    return data;
  },

  async update(id, formData) {
    const { data } = await api.put(`/consumable-materials/${id}`, formData, multipart);
    return data;
  },

  async toggle(id) {
    const { data } = await api.patch(`/consumable-materials/${id}/toggle`);
    return data;
  },
};

export default consumableMaterialService;
