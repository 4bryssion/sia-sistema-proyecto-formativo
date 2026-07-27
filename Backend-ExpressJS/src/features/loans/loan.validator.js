import Joi from 'joi';

const materialLine = Joi.object({
  materialId: Joi.number().integer().positive().required(),
  borrowedQuantity: Joi.number().integer().positive().required(),
});

export const createLoanSchema = Joi.object({
  apprenticeGroup: Joi.number().integer().positive().required(),
  useJustification: Joi.string().max(255).required(),
  returnDate: Joi.date().iso().greater('now').required()
    .messages({ 'date.greater': 'La fecha de devolución debe ser futura.' }),
  lenderId: Joi.number().integer().positive().required(),
  receiverId: Joi.number().integer().positive().invalid(Joi.ref('lenderId')).required(),
  materials: Joi.array().items(materialLine).min(1).required(),
});

export const updateLoanSchema = createLoanSchema.keys({
  status: Joi.string().valid('Activo', 'Finalizado'),
});

export const signLoanSchema = Joi.object({
  token: Joi.string().required(),
});

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
