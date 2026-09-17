import api from "@/shared/services/axiosInstance";

// getAll acepta el contrato de `status` del backend:
//   sin params -> solo activas (lo que necesitan los selects de materiales)
//   { status: "all" } -> activas e inactivas (lo que necesita el listado, para
//   poder volver a activar una marca desactivada; antes desaparecía de la tabla)
const brandService = {
  async getAll(params)  { const { data } = await api.get("/brands", { params });    return data; },
  async getById(id)     { const { data } = await api.get(`/brands/${id}`);          return data; },
  async create(payload) { const { data } = await api.post("/brands", payload);      return data; },
  async update(id, p)   { const { data } = await api.put(`/brands/${id}`, p);       return data; },
  async toggle(id)      { const { data } = await api.patch(`/brands/${id}/toggle`); return data; },
};

export default brandService;
