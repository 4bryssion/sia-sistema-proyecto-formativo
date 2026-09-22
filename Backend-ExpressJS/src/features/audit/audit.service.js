import { auditRepository } from './audit.repository.js';

// Tope de filas por descarga. No es arbitrario: por encima de esto, Excel deja
// de abrirse con comodidad y la respuesta empieza a pesar más de lo que una
// petición debería. Si se alcanza, se avisa para que se acote el rango en vez de
// entregar un archivo recortado en silencio.
export const MAX_FILAS = 20000;

// Rango máximo consultable de una vez. Un año cubre cualquier revisión razonable
// y evita que una petición sin querer barra toda la historia del sistema.
const MAX_DIAS = 366;
const DIA_MS = 24 * 60 * 60 * 1000;

export const auditService = {
  /**
   * @param {string} desde  YYYY-MM-DD
   * @param {string} hasta  YYYY-MM-DD
   */
  async getRange(desde, hasta) {
    if (!desde || !hasta) {
      throw new Error('Indica la fecha de inicio y la de fin de la auditoría.');
    }

    const inicio = new Date(`${desde}T00:00:00.000Z`);
    // Hasta el final del día indicado: si se tomara la medianoche, pedir
    // "del 1 al 5" dejaría fuera todo lo ocurrido el día 5.
    const fin = new Date(`${hasta}T23:59:59.999Z`);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      throw new Error('Las fechas de la auditoría no son válidas.');
    }
    if (inicio > fin) {
      throw new Error('La fecha de inicio no puede ser posterior a la de fin.');
    }
    if ((fin - inicio) / DIA_MS > MAX_DIAS) {
      throw new Error('El rango de la auditoría no puede superar un año. Acota las fechas.');
    }

    const total = await auditRepository.countRange(inicio, fin);
    const registros = await auditRepository.findRange(inicio, fin, MAX_FILAS);

    return {
      registros,
      total,
      // El consumidor necesita saber si lo que recibe está recortado: entregar
      // 20.000 filas de 60.000 sin decirlo daría una auditoría incompleta con
      // apariencia de completa.
      truncado: total > MAX_FILAS,
      maxFilas: MAX_FILAS,
    };
  },
};
