import Joi from 'joi';

export const createLoanReturnSchema = Joi.object({
  loanId: Joi.number().integer().positive().required(),
  materialId: Joi.number().integer().positive().required(),
  remainingQuantity: Joi.number().integer().min(0).optional().allow(null),
  observations: Joi.string().max(255).required(),
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
