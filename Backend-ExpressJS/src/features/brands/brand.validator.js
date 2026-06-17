import Joi from 'joi';

export const createBrandSchema = Joi.object({
  brandName: Joi.string().max(100).required(),
});

export const updateBrandSchema = Joi.object({
  brandName: Joi.string().max(100),
}).min(1);

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Error de validación.',
      detalles: error.details.map((d) => d.message),
    });
  }
  next();
};
