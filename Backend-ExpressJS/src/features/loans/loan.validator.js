import Joi from 'joi';

const materialLine = Joi.object({
  materialId: Joi.number().integer().positive().required(),
  borrowedQuantity: Joi.number().integer().positive().required(),
});

export const createLoanSchema = Joi.object({
  apprenticeGroup: Joi.number().integer().positive().required(),
  useJustification: Joi.string().max(255).required(),
  // Se permite HOY: comparación por fecha de calendario (Joi parsea "YYYY-MM-DD"
  // en UTC medianoche y greater('now') rechazaba el mismo día por desfase de TZ)
  returnDate: Joi.date().iso().required().custom((value, helpers) => {
    const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
    if (value.toISOString().slice(0, 10) < todayLocal) return helpers.error('date.greater');
    return value;
  }).messages({ 'date.greater': 'La fecha de devolución no puede ser anterior a hoy.' }),
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
