import Joi from 'joi';

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(1).required(),
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
