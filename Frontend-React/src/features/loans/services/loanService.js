import api from "@/shared/services/axiosInstance";

const loanService = {
  async getAll(status) {
    const { data } = await api.get("/loans", { params: status ? { status } : {} });
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/loans/${id}`);
    return data;
  },
  async toggle(id) {
    const { data } = await api.patch(`/loans/${id}/toggle`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/loans", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/loans/${id}`, payload);
    return data;
  },
  // Rutas públicas de firma (P40) — funcionan sin sesión, el token del enlace es la autenticación.
  async getSignatureInfo(token) {
    const { data } = await api.get(`/loans/sign`, { params: { token } });
    return data;
  },
  async sign(token) {
    const { data } = await api.post(`/loans/sign`, { token });
    return data;
  },
};

export default loanService;
