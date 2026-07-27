import api from "@/shared/services/axiosInstance";

const loanReturnService = {
  async getAll() {
    const { data } = await api.get("/loan-returns");
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/loan-returns/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/loan-returns", payload);
    return data;
  },
};

export default loanReturnService;
