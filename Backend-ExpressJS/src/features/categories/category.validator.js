import Joi from 'joi';

export const createCategorySchema = Joi.object({
  categoryName: Joi.string().max(100).required(),
  // (p50) Si la categoría exige dimensiones al material. Es un dato de la fila,
  // no algo que se deduzca de su nombre.
  requiresDimensions: Joi.boolean().default(false),
});

export const updateCategorySchema = Joi.object({
  categoryName: Joi.string().max(100),
  requiresDimensions: Joi.boolean(),
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
