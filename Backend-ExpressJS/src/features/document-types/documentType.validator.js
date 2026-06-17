import Joi from 'joi';

export const createDocumentTypeSchema = Joi.object({
  documentName: Joi.string().max(50).required(),
  description: Joi.string().max(150).optional().allow('', null),
});

export const updateDocumentTypeSchema = Joi.object({
  documentName: Joi.string().max(50),
  description: Joi.string().max(150).allow('', null),
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
