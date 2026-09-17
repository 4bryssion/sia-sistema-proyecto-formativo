import api from "@/shared/services/axiosInstance";

// Vive en shared (no en features/inventories/services) porque materiales lo
// consume para llenar el select de inventario: regla de módulos cruzados.
//
// getAll acepta el mismo contrato de `status` del backend:
//   sin params -> solo activos (lo que necesitan los selects de materiales)
//   { status: "all" } -> activos e inactivos (lo que necesita el listado, para
//   poder volver a activar uno desactivado)
const inventoryService = {
  async getAll(params)   { const { data } = await api.get("/inventories", { params }); return data; },
  async getById(id)      { const { data } = await api.get(`/inventories/${id}`);          return data; },
  async create(payload)  { const { data } = await api.post("/inventories", payload);      return data; },
  async update(id, p)    { const { data } = await api.put(`/inventories/${id}`, p);       return data; },
  async toggle(id)       { const { data } = await api.patch(`/inventories/${id}/toggle`); return data; },
};

export default inventoryService;
