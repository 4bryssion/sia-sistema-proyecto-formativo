import Joi from 'joi';

// Mismo patrón que el resto de los validadores del proyecto: `validate` corta
// con 400 y la lista de detalles antes de llegar al controlador.
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
  if (error) {
    return res.status(400).json({
      error: 'Datos inválidos.',
      detalles: error.details.map((d) => d.message),
    });
  }
  next();
};

export const updateSupportEmailSchema = Joi.object({
  // 255 porque es el ancho de la columna. `tlds: false` para no rechazar un
  // dominio institucional interno, que es justo lo que suele usar un centro de
  // formación (p. ej. soporte@sena.local).
  supportEmail: Joi.string().trim().lowercase().email({ tlds: false }).max(255).required()
    .messages({
      'string.email': 'El correo de soporte no tiene un formato válido.',
      'string.empty': 'El correo de soporte es obligatorio.',
      'any.required': 'El correo de soporte es obligatorio.',
    }),
});
