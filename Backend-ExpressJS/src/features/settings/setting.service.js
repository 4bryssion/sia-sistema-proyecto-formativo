import { settingRepository } from './setting.repository.js';
import { getActorId } from '../../middleware/requestContext.js';

// Las claves que el sistema conoce. Viven aquí y no sueltas por el código para
// que añadir un ajuste sea una línea y no una búsqueda por todo el proyecto.
export const CLAVES = {
  correoSoporte: 'support_email',
};

// Valor de respaldo. Solo se usa si la fila no existe —base sin migrar o sin
// sembrar—: el modal de soporte tiene que poder mostrar ALGO, porque lo abre
// justamente quien no puede entrar al sistema.
const RESPALDO_CORREO_SOPORTE = 'superadmin@sia.local';

export const settingService = {
  /**
   * Correo de soporte. Lo lee el login SIN sesión, así que es público a
   * propósito: es el dato que el sistema publica para que alguien que no puede
   * entrar sepa a quién escribir. No se devuelve nada más de la fila.
   */
  async getSupportEmail() {
    const fila = await settingRepository.findByKey(CLAVES.correoSoporte);
    return { supportEmail: fila?.settingValue ?? RESPALDO_CORREO_SOPORTE };
  },

  async updateSupportEmail(supportEmail) {
    const limpio = String(supportEmail).trim().toLowerCase();
    const fila = await settingRepository.upsertByKey(CLAVES.correoSoporte, limpio, getActorId());
    return { supportEmail: fila.settingValue };
  },
};
