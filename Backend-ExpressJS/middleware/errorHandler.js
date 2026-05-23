import multer from "multer";

// Middleware global de manejo de errores.
// Express lo reconoce como error handler por la firma de 4 parámetros (err, req, res, next).
// Se activa cuando cualquier middleware o ruta llama a next(err) o lanza un error.
const errorHandler = (err, req, res, next) => {

    // --- Errores de Multer ---
    // Ocurren antes de llegar al controlador, por eso no los atrapa el try/catch
    if (err instanceof multer.MulterError) {
        const mensajes = {
            LIMIT_FILE_SIZE:      'El archivo supera el límite de 5MB.',
            LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado.',
            LIMIT_FILE_COUNT:     'Se enviaron demasiados archivos.',
        };
        return res.status(400).json({ error: mensajes[err.code] ?? err.message });
    }

    // --- Error de tipo de archivo no permitido ---
    // Lo lanza el fileFilter de multerConfig.js cuando el mimetype no está en la lista
    if (err.message === 'Tipo de archivo no permitido') {
        return res.status(400).json({ error: err.message });
    }

    // --- Errores de Mongoose: validación de Schema ---
    // Ocurre cuando un campo requerido falta o no pasa las reglas del modelo
    if (err.name === 'ValidationError') {
        const campos = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: 'Error de validación.', campos });
    }

    // --- Errores de Mongoose: ObjectId inválido ---
    // Ocurre cuando se pasa un _id que no tiene el formato correcto de MongoDB
    if (err.name === 'CastError') {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    // --- Error de MongoDB: clave duplicada ---
    // Ocurre cuando se intenta insertar un valor único que ya existe en la colección
    if (err.code === 11000) {
        const campo = Object.keys(err.keyValue)[0];
        return res.status(409).json({ error: `El valor del campo '${campo}' ya está en uso.` });
    }

    // --- Fallback: cualquier otro error no contemplado ---
    // En producción no exponemos el mensaje interno para no filtrar información sensible
    console.error('Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
};

export default errorHandler;
