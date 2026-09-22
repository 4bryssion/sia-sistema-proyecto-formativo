import api from "@/shared/services/axiosInstance";

// (p50) Vive en shared y no en features/returnable-material/services porque lo
// consumen DOS módulos: el propio de categorías y el de material devolutivo,
// que llena con él su select y su "Crear y asignar nueva categoría". Regla de
// módulos cruzados.
//
// getAll acepta el mismo contrato de `status` del backend:
//   sin params        -> solo activas (lo que necesita el select de materiales)
//   { status: "all" } -> activas e inactivas (lo que necesita el listado, para
//                        poder volver a activar una desactivada)
const categoryService = {
  async getAll(params)  { const { data } = await api.get("/categories", { params }); return data; },
  async getById(id)     { const { data } = await api.get(`/categories/${id}`);          return data; },
  async create(payload) { const { data } = await api.post("/categories", payload);      return data; },
  async update(id, p)   { const { data } = await api.put(`/categories/${id}`, p);       return data; },
  async toggle(id)      { const { data } = await api.patch(`/categories/${id}/toggle`); return data; },
};

export default categoryService;
