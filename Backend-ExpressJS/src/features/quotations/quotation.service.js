import { quotationRepository } from './quotation.repository.js';
import { getActorId } from '../../middleware/requestContext.js';
import { hashDeArchivo, esHashValido } from '../../shared/fileHash.js';

// (p50) Topes de la relación material ↔ cotización.
//
// Son asimétricos a propósito: un material necesita entre 1 y 3 cotizaciones
// que respalden su precio, mientras que una misma cotización puede respaldar
// cuantos materiales haga falta (una cotización de un proveedor suele cubrir
// varios artículos).
export const MIN_COTIZACIONES_POR_MATERIAL = 1;
export const MAX_COTIZACIONES_POR_MATERIAL = 3;

// Cuántos PDF admite UNA carga desde el módulo de cotizaciones. No tiene que ver
// con el tope por material: aquí se están dando de alta documentos, no
// asignándolos.
export const MAX_POR_CARGA = 6;

/**
 * Convierte el campo `quotationIds` de un FormData en una lista de números.
 *
 * Vive aquí y no en cada módulo de material porque la regla es de cotizaciones:
 * los materiales solo la consumen. Devuelve `undefined` cuando el campo no vino,
 * que es como se distingue "no lo toqué" de "lo dejé vacío".
 */
export const parseQuotationIds = (raw) => {
  if (raw === undefined || raw === '') return undefined;
  let lista;
  try {
    lista = JSON.parse(raw);
    if (!Array.isArray(lista)) throw new Error();
  } catch {
    throw new Error('La lista de cotizaciones es inválida.');
  }
  const ids = lista.map(Number);
  if (ids.some((n) => !Number.isInteger(n) || n <= 0)) {
    throw new Error('La lista de cotizaciones contiene identificadores inválidos.');
  }
  return ids;
};

export const quotationService = {
  // Mismo contrato de `status` que el resto: active (por defecto) | inactive | all
  async getAll(status) {
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    return quotationRepository.findAll(filter);
  },

  async getById(id) {
    const item = await quotationRepository.findById(id);
    if (!item) throw new Error('Cotización no encontrada.');
    return item;
  },

  /**
   * Da de alta una cotización por cada PDF recibido.
   *
   * El nombre de la cotización ES el del archivo que subió la persona: no hay
   * otro campo que escribir, y usar el nombre generado en disco (que lleva un
   * sufijo aleatorio para evitar colisiones) no le diría nada a nadie.
   */
  async createFromFiles(files) {
    if (!files?.length) throw new Error('No se recibió ningún archivo.');
    if (files.length > MAX_POR_CARGA) {
      throw new Error(`Se pueden cargar máximo ${MAX_POR_CARGA} cotizaciones por envío.`);
    }

    const actor = getActorId();

    // (p50) La huella se calcula AQUÍ, sobre el archivo ya escrito en disco, y
    // nunca se acepta la que manda el navegador: el frontend calcula la suya
    // para poder avisar antes de subir nada, pero la que se guarda es esta.
    //
    // En paralelo porque son lecturas de disco independientes: seis archivos de
    // 10MB tardan lo que el más lento, no la suma.
    const huellas = await Promise.all(files.map((f) => hashDeArchivo(f.path)));

    return quotationRepository.createMany(
      files.map((f, i) => ({
        fileName: f.originalname,
        fileUrl: `/uploads/${f.filename}`,
        mimeType: f.mimetype,
        fileHash: huellas[i],
        uploadedBy: actor,
      })),
    );
  },

  /**
   * (p50) ¿Alguna de estas huellas corresponde a una cotización ya cargada?
   *
   * La llama el formulario ANTES de subir nada: el navegador calcula la huella
   * de cada PDF elegido y pregunta. Así el aviso llega antes de esperar a que
   * suban 60MB, y solo se sube lo que se decida subir.
   *
   * Devuelve un objeto {huella: cotización} para que el cliente pueda emparejar
   * cada archivo con la que ya existe y enseñar su nombre.
   */
  async buscarPorHashes(hashes) {
    if (!Array.isArray(hashes)) throw new Error('Se esperaba una lista de huellas.');

    const limpias = [...new Set(hashes.map((h) => String(h ?? '').toLowerCase()))]
      .filter(esHashValido);

    if (limpias.length === 0) return {};
    if (limpias.length > MAX_POR_CARGA) {
      throw new Error(`Se pueden comprobar máximo ${MAX_POR_CARGA} archivos a la vez.`);
    }

    const encontradas = await quotationRepository.findByHashes(limpias);

    const porHuella = {};
    for (const c of encontradas) {
      // La primera gana: findByHashes las devuelve de la más antigua a la más
      // reciente, y la que tiene sentido reutilizar es la original.
      if (!porHuella[c.fileHash]) porHuella[c.fileHash] = c;
    }
    return porHuella;
  },

  async toggle(id) {
    const record = await quotationService.getById(id);
    // Deshabilitarla NO la quita de los materiales que ya la tienen asignada:
    // sería reescribir el respaldo de un precio pasado. Lo que cambia es que
    // deja de ofrecerse al crear o editar.
    const materiales = await quotationRepository.countMaterials(id);
    const updated = await quotationRepository.toggle(id, !record.isActive);
    return { ...updated, materialesAsignados: materiales };
  },

  /**
   * Comprueba los ids que un material quiere asignarse, ANTES de guardarlo.
   *
   * Se valida aquí y no en Joi porque son reglas que necesitan la base de datos:
   * cuántas son, que existan y que estén habilitadas.
   *
   * @param {number[]} ids
   * @param {{exigirMinimo?: boolean}} opciones
   */
  async validarAsignacion(ids, { exigirMinimo = true } = {}) {
    const unicos = [...new Set(ids)];

    if (unicos.length !== ids.length) {
      throw new Error('Hay cotizaciones repetidas en la asignación.');
    }
    if (exigirMinimo && unicos.length < MIN_COTIZACIONES_POR_MATERIAL) {
      throw new Error('El material debe tener al menos una cotización asignada.');
    }
    if (unicos.length > MAX_COTIZACIONES_POR_MATERIAL) {
      throw new Error(`Un material admite máximo ${MAX_COTIZACIONES_POR_MATERIAL} cotizaciones.`);
    }

    if (unicos.length) {
      const habilitadas = await quotationRepository.contarHabilitadas(unicos);
      if (habilitadas !== unicos.length) {
        throw new Error('Alguna de las cotizaciones seleccionadas no existe o está deshabilitada.');
      }
    }

    return unicos;
  },
};
