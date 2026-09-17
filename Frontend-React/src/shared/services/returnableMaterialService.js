import api from "@/shared/services/axiosInstance";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

const returnableMaterialService = {
  async getAll(status = "active") {
    const { data } = await api.get("/returnable-materials", { params: { status } });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/returnable-materials/${id}`);
    return data;
  },

  async create(formData) {
    const { data } = await api.post("/returnable-materials", formData, multipart);
    return data;
  },

  async update(id, formData) {
    const { data } = await api.put(`/returnable-materials/${id}`, formData, multipart);
    return data;
  },

  async toggle(id) {
    const { data } = await api.patch(`/returnable-materials/${id}/toggle`);
    return data;
  },
};

export default returnableMaterialService;
