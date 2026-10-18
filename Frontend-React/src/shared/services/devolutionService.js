import api from "@/shared/services/axiosInstance";

const devolutionService = {
  // (p52) `silencioso` evita que una precarga de fondo levante el modal de «sin
  // permisos»: el interceptor lo muestra ante un 403 salvo que la peticion pida
  // lo contrario. El listado de prestamos pide las devoluciones aunque quien
  // mira no tenga `list_loan_returns`, y entonces la alerta saltaba sobre una
  // tabla que acababa de abrirse.
  async getAll(status = "active", { silencioso = false } = {}) {
    const { data } = await api.get("/devolutions", { params: { status }, silencioso });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/devolutions/${id}`);
    return data;
  },

  // Fase 1: registrar la devolución. El tipo (Total/Parcial) NO se envía: lo
  // deduce el backend comparando lo devuelto contra lo pendiente del préstamo.
  async create(payload) {
    const { data } = await api.post("/devolutions", payload);
    return data;
  },

  // Fase 2: autorizar. Es la única llamada que mueve inventario.
  async authorize(id, payload) {
    const { data } = await api.patch(`/devolutions/${id}/authorize`, payload);
    return data;
  },

  async toggle(id) {
    const { data } = await api.patch(`/devolutions/${id}/toggle`);
    return data;
  },
};

export default devolutionService;
