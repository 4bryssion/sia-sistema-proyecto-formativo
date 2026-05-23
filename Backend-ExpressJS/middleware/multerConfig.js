import multer from "multer";
import path from "path";

// --- Storage compartido ---
// Define cómo y dónde se guardan los archivos subidos
const storage = multer.diskStorage({

    // Carpeta destino de todos los archivos subidos
    destination: (req, file, cb) => {
        cb(null, path.resolve('uploads'));
    },

    // Genera un nombre único para evitar sobreescribir archivos existentes
    filename: (req, file, cb) => {
        const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/[^\s\w.-]/g, '_');
        cb(null, `${base}_${unique}${ext}`);
    }
});

// --- Filtros de archivo ---

// Solo permite imágenes en formato jpeg, jpg y png
// Usado por: usuarios y materiales de consumo
const fileFilterImagen = (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/jpg'];
    if (permitidos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'), false);
};

// Permite imágenes y además archivos pdf/excel
// Usado por: materiales devolutivos (imagen + ficha_tecnica)
const fileFilterArchivos = (req, file, cb) => {
    const permitidosImagen = ['image/jpeg', 'image/png', 'image/jpg'];
    const permitidosFicha = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (permitidosImagen.includes(file.mimetype)) cb(null, true);
    else if (permitidosFicha.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'), false);
};

// --- Instancias de Multer ---

// Para usuarios y materiales de consumo (solo imágenes, límite 5MB)
export const uploadImagen = multer({
    storage,
    fileFilter: fileFilterImagen,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Para materiales devolutivos (imágenes + pdf/excel, límite 5MB)
export const uploadArchivos = multer({
    storage,
    fileFilter: fileFilterArchivos,
    limits: { fileSize: 5 * 1024 * 1024 }
});
