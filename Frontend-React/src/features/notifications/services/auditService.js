import api from "@/shared/services/axiosInstance";

// (p50) La auditoría no tiene pantalla propia: se descarga desde notificaciones,
// que es donde vive el botón. Por eso el servicio vive aquí y no en shared: no
// lo usa ningún otro módulo.
//
// Solo lectura. El backend exige el permiso `download_audit`, que no está en la
// matriz de ningún rol y por tanto solo tiene el grupo SuperAdmin.
const auditService = {
  /**
   * @param {string} from YYYY-MM-DD
   * @param {string} to   YYYY-MM-DD
   * @returns {Promise<{registros:Array, total:number, truncado:boolean, maxFilas:number}>}
   */
  async getRange(from, to) {
    const { data } = await api.get("/audit", { params: { from, to } });
    return data;
  },
};

export default auditService;
