import api from "@/shared/services/axiosInstance";

const categoryService = {
  async getAll() {
    const { data } = await api.get("/categories");
    return data;
  },
};

export default categoryService;
