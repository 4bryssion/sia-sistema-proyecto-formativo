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
