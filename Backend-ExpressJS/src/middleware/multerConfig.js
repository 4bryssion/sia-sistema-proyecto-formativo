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

const filesFileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedFiles = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (allowedImages.includes(file.mimetype)) cb(null, true);
  else if (allowedFiles.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de archivo no permitido'), false);
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
