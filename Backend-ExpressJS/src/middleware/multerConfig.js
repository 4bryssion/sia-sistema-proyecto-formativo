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
const ALLOWED_BY_FIELD = {
  image: ['image/jpeg', 'image/png', 'image/jpg'],
  // La ficha técnica NO acepta imágenes: es documentación, y en el visor se
  // muestra como documento descargable
  technical_sheet: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

const filesFileFilter = (req, file, cb) => {
  const allowed = ALLOWED_BY_FIELD[file.fieldname];
  if (!allowed) return cb(new Error('Campo de archivo inesperado.'), false);

  if (allowed.includes(file.mimetype)) return cb(null, true);

  const mensaje =
    file.fieldname === 'technical_sheet'
      ? 'La ficha técnica solo acepta archivos PDF o Excel.'
      : 'La imagen solo acepta archivos JPG o PNG.';
  cb(new Error(mensaje), false);
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadFiles = multer({
  storage,
  fileFilter: filesFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
