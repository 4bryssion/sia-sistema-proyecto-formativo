import Joi from 'joi';

export const createLoanSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  materialId: Joi.number().integer().positive().required(),
  borrowedQuantity: Joi.number().integer().positive().required(),
  apprenticeGroup: Joi.number().integer().positive().required(),
  useJustification: Joi.string().max(255).required(),
  returnDate: Joi.date().iso().greater('now').required()
    .messages({ 'date.greater': 'La fecha de devolución debe ser futura.' }),
});

export const updateLoanSchema = Joi.object({
  userId: Joi.number().integer().positive(),
  materialId: Joi.number().integer().positive(),
  borrowedQuantity: Joi.number().integer().positive(),
  apprenticeGroup: Joi.number().integer().positive(),
  useJustification: Joi.string().max(255),
  returnDate: Joi.date().iso(),
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
