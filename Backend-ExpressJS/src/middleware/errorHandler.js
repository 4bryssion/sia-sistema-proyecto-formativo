import multer from 'multer';

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'El archivo supera el límite de tamaño.',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado.',
      LIMIT_FILE_COUNT: 'Se enviaron demasiados archivos.',
    };
    return res.status(400).json({ error: messages[err.code] ?? err.message });
  }
  if (err.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({ error: err.message });
  }

  // Prisma: clave única duplicada
  if (err.code === 'P2002') {
    const campo = err.meta?.target?.[0] ?? 'campo';
    return res.status(409).json({ error: `El valor del campo '${campo}' ya está en uso.` });
  }
  // Prisma: registro no encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado.' });
  }
  // Prisma: FK violación
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Referencia a un registro que no existe.' });
  }
  // Prisma: validación de tipos (no tiene code, pero sí nombre de clase)
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: 'Error de validación en los datos.' });
  }

  if (err.message) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
};

export default errorHandler;
