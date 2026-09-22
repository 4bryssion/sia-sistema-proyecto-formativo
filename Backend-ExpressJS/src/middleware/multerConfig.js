import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^\s\w.-]/g, '_');
    cb(null, `${base}_${unique}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de archivo no permitido'), false);
};

// Tipos permitidos POR CAMPO, no por instancia de multer.
//
// uploadFiles solo lo usa material devolutivo, que sube dos cosas distintas por
// la misma petición: la imagen del material y sus fichas técnicas. Un filtro
// único dejaría subir un PDF como imagen y una foto como ficha; multer entrega
// el `fieldname` en el filtro, así que cada campo valida lo suyo.
// (p50) Topes de subida.
//
// `fileSize` de multer es POR ARCHIVO, no por petición: el 5MB anterior no era
// un presupuesto que los archivos se repartieran, sino un tope individual. Sube
// a 10MB porque los dos casos reales que lo rozaban son la foto de un celular
// moderno (2-6MB) y, sobre todo, un PDF escaneado de varias páginas a 300dpi,
// que pasa de 5MB con facilidad — y las fichas técnicas y las cotizaciones del
// centro llegan escaneadas.
//
// Los otros dos topes NO EXISTÍAN, y son los que de verdad acotan el riesgo: sin
// ellos, subir el tope por archivo lo multiplicaba por el número de archivos
// permitidos. Un material admite 3 imágenes + 3 fichas + 3 cotizaciones, así que
// una sola petición podía llegar a 90MB sin que nada la parara.
export const MB = 1024 * 1024;

// Techo de la petición completa, en bytes. Multer NO tiene un límite de tamaño
// total —sus `limits` son por archivo o por campo—, así que este se aplica
// aparte, en `limitarTamanoTotal`.
export const MAX_PETICION = 30 * MB;

const LIMITES = {
  fileSize: 10 * MB,
  // Cuántos archivos admite una petición, sumando todos los campos. Los 9 de un
  // material (3 imágenes + 3 fichas + 3 cotizaciones), más holgura.
  files: 12,
  // Tope de un campo de TEXTO, no del archivo ni de la petición. Los campos de
  // texto más grandes que se mandan son los JSON de cuentadantes y de orden de
  // archivos, que no llegan a un kilobyte: 1MB es holgadísimo y a cambio impide
  // que alguien cuele megabytes disfrazados de campo normal.
  fieldSize: 1 * MB,
};

/**
 * Rechaza la petición si se anuncia más pesada que MAX_PETICION.
 *
 * Va ANTES de multer: cortar aquí evita escribir en disco algo que se va a
 * rechazar de todos modos.
 *
 * Honestidad sobre su alcance: se apoya en la cabecera Content-Length, que una
 * subida en trozos (`Transfer-Encoding: chunked`) puede no traer. No es una
 * garantía criptográfica, es la primera barrera. El límite duro de verdad sigue
 * siendo `fileSize` × `files` de multer, que sí se comprueba mientras se lee.
 */
export const limitarTamanoTotal = (req, res, next) => {
  const anunciado = Number(req.headers['content-length']);
  if (Number.isFinite(anunciado) && anunciado > MAX_PETICION) {
    return res.status(413).json({
      error: `La carga supera el máximo de ${Math.round(MAX_PETICION / MB)}MB por envío. Sube menos archivos a la vez o reduce su tamaño.`,
    });
  }
  next();
};

const ALLOWED_BY_FIELD = {
  image: ['image/jpeg', 'image/png', 'image/jpg'],
  // La ficha técnica NO acepta imágenes: es documentación, y en el visor se
  // muestra como documento descargable
  technical_sheet: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  // (p50) Cotización: SOLO PDF. A diferencia de la ficha técnica no admite
  // Excel — una cotización es un documento firmado o membretado, no una hoja
  // de cálculo.
  quotation: ['application/pdf'],
};

const filesFileFilter = (req, file, cb) => {
  const allowed = ALLOWED_BY_FIELD[file.fieldname];
  if (!allowed) return cb(new Error('Campo de archivo inesperado.'), false);

  if (allowed.includes(file.mimetype)) return cb(null, true);

  const MENSAJES = {
    technical_sheet: 'La ficha técnica solo acepta archivos PDF o Excel.',
    quotation: 'Las cotizaciones solo aceptan archivos PDF.',
    image: 'La imagen solo acepta archivos JPG o PNG.',
  };
  cb(new Error(MENSAJES[file.fieldname] ?? 'Tipo de archivo no permitido.'), false);
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: LIMITES,
});

export const uploadFiles = multer({
  storage,
  fileFilter: filesFileFilter,
  limits: LIMITES,
});

// (p50) Carga de cotizaciones desde su propio módulo: hasta 6 PDF por carga,
// cada uno una cotización distinta. El tope de 6 es del formulario; `files: 12`
// de LIMITES es el techo duro de multer, que aquí no llega a aplicarse.
export const uploadQuotations = multer({
  storage,
  fileFilter: filesFileFilter,
  limits: { ...LIMITES, files: 6 },
});
