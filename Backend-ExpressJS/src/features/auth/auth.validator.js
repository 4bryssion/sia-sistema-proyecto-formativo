import Joi from 'joi';

export const loginSchema = Joi.object({
  email:    Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(1).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
});

export const verifyResetCodeSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  code:  Joi.string().pattern(/^\d{6}$/).required(),
});

// (p48) Cambio de contraseña autenticado.
//
// A diferencia del resto del proyecto —donde la complejidad se valida solo con Zod
// en el frontend— aquí SÍ se exige en el backend: es el único punto donde el
// usuario elige su propia contraseña estando dentro del sistema, y una petición
// hecha por fuera del formulario podría fijar una contraseña de 8 caracteres
// triviales que después protege toda su sesión.
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required(),
  newPassword: Joi.string()
    .min(8).max(72) // 72: bcrypt ignora todo lo que pase de ahí, y aceptarlo daría una falsa sensación de fortaleza
    .pattern(/[A-Z]/, 'una mayúscula')
    .pattern(/[a-z]/, 'una minúscula')
    .pattern(/[0-9]/, 'un número')
    .pattern(/[^A-Za-z0-9]/, 'un carácter especial')
    .required(),
})
  // Se comprueba también aquí y no solo en el service: así el error llega como
  // validación del campo y el formulario puede señalarlo sin gastar un intento
  // del limitador de la ruta.
  .custom((value, helpers) => {
    if (value.currentPassword === value.newPassword) {
      return helpers.error('any.custom', { message: 'La nueva contraseña debe ser distinta de la actual.' });
    }
    return value;
  });

export const resetPasswordSchema = Joi.object({
  resetTicket: Joi.string().required(),
  password:    Joi.string().min(8).required(), // misma regla que updateUserSchema — la complejidad extra es solo Zod en frontend
});

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
  if (error) {
    return res.status(400).json({
      error: 'Error de validación.',
      detalles: error.details.map((d) => d.message),
    });
  }
  next();
};
