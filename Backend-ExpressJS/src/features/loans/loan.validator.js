import Joi from 'joi';

const materialLine = Joi.object({
  materialId: Joi.number().integer().positive().required(),
  borrowedQuantity: Joi.number().integer().positive().required(),
});

export const createLoanSchema = Joi.object({
  // (p48) Opcional: no todo préstamo se hace para un grupo de aprendices
  apprenticeGroup: Joi.number().integer().positive().optional().allow(null, ''),
  // (p48) Naturaleza del préstamo. NO se deduce de que el receptor esté
  // registrado: un usuario del sistema puede llevarse material a una actividad
  // externa, y alguien de fuera puede recibirlo internamente.
  loanType: Joi.string().valid('Interno', 'Externo').required(),
  useJustification: Joi.string().max(255).required(),
  // Se permite HOY: comparación por fecha de calendario (Joi parsea "YYYY-MM-DD"
  // en UTC medianoche y greater('now') rechazaba el mismo día por desfase de TZ)
  returnDate: Joi.date().iso().required().custom((value, helpers) => {
    const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
    if (value.toISOString().slice(0, 10) < todayLocal) return helpers.error('date.greater');
    return value;
  }).messages({ 'date.greater': 'La fecha de devolución no puede ser anterior a hoy.' }),
  lenderId: Joi.number().integer().positive().required(),
  // (p48) El receptor es UNA de dos cosas, nunca las dos ni ninguna:
  // - receiverId: un usuario registrado, distinto del prestador
  // - receiverEmail: un correo de alguien que NO está en el sistema, al que se le
  //   envía el enlace de firma
  // `xor` es lo que expresa exactamente "uno u otro, obligatorio"; con dos
  // `optional()` sueltos se podrían mandar ambos o ninguno.
  receiverId: Joi.number().integer().positive().invalid(Joi.ref('lenderId')),
  receiverEmail: Joi.string().email({ tlds: { allow: false } }).max(150).lowercase(),
  materials: Joi.array().items(materialLine).min(1).required(),
})
  .xor('receiverId', 'receiverEmail')
  .messages({
    'object.xor': 'Indique el receptor: un usuario registrado o un correo electrónico, no ambos.',
    'object.missing': 'Indique el receptor: un usuario registrado o un correo electrónico.',
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
