import multer from 'multer';

// (p52) Los errores que NO son del dominio: estos no los lanza una regla de
// negocio, los produce un defecto del codigo. Se distinguen por su clase y no
// por su texto, porque el texto es justo lo que no hay que ensenarle a nadie.
export const esFalloDeProgramacion = (err) =>
  err instanceof TypeError
  || err instanceof ReferenceError
  || err instanceof RangeError
  || err instanceof SyntaxError;

// (p52) Este manejador estaba COPIADO, identico, en los 14 routers: cada uno
// convertia en 400 cualquier error con mensaje. Vive aqui una sola vez para que
// el arreglo de arriba valga para todos y no haya que acordarse de 14 sitios.
export const errorDeNegocio = (err, req, res, next) => {
  if (err.message && !err.code && !esFalloDeProgramacion(err)) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

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

  // (p52) Un fallo de PROGRAMACION no es un mensaje para el usuario, y hasta
  // ahora lo era: cualquier error con `.message` salia como 400 con el texto
  // crudo de JavaScript —«Cannot read properties of undefined»— y el
  // console.error de abajo no se alcanzaba nunca, asi que el servidor no dejaba
  // ni una linea de rastro. Se separan los dos casos: el error de negocio sigue
  // siendo un 400 con su mensaje en espanol; el fallo interno es un 500 generico
  // y queda en el log, que es donde sirve.
  if (esFalloDeProgramacion(err)) {
    console.error('Fallo interno no controlado:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }

  if (err.message) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
};

export default errorHandler;
