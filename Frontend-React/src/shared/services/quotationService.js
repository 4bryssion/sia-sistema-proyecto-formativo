import api from "@/shared/services/axiosInstance";

// (p50) Vive en shared porque lo consumen TRES módulos: el propio de
// cotizaciones, y los de material de consumo y devolutivo, que las asignan al
// crear y al editar. Regla de módulos cruzados.
//
// getAll acepta el mismo contrato de `status` del backend:
//   sin params        -> solo habilitadas (lo que necesita el select de material)
//   { status: "all" } -> habilitadas y deshabilitadas (lo que necesita el
//                        listado, para poder volver a habilitar una)
const quotationService = {
  async getAll(params) { const { data } = await api.get("/quotations", { params }); return data; },

  // Una carga produce VARIAS cotizaciones, una por PDF. El backend devuelve las
  // creadas para que quien las cargó pueda autoseleccionarlas sin recargar.
  async upload(formData) {
    const { data } = await api.post("/quotations", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  // (p50) Comprobación previa de duplicados. Manda solo las huellas, ningún
  // archivo: sirve para avisar antes de empezar a subir.
  // Devuelve { huella: cotización } con las que ya existen.
  async buscarDuplicados(hashes) {
    const { data } = await api.post("/quotations/duplicados", { hashes });
    return data;
  },

  async toggle(id) { const { data } = await api.patch(`/quotations/${id}/toggle`); return data; },
};

export default quotationService;
