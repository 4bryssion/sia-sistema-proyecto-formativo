import api from "@/shared/services/axiosInstance";

const documentTypeService = {
  async getAll() { const { data } = await api.get("/document-types"); return data; },
};

export default documentTypeService;
