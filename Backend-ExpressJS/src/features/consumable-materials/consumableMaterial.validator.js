import Joi from 'joi';

const validateQuantityVsPlate = (value, helpers) => {
  const { senaPlate, quantity } = value;
  if (!senaPlate && (quantity === undefined || quantity === null)) {
    return helpers.error('any.custom', { message: '"quantity" es obligatoria cuando no hay senaPlate.' });
  }
  return value;
};

const validStatuses = ['Disponible', 'No_disponible', 'Mantenimiento', 'En_prestamo', 'Traslado', 'Baja'];

export const createConsumableMaterialSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  brandId: Joi.number().integer().positive().required(),
  senaPlate: Joi.string().max(20).optional().allow('', null),
  materialName: Joi.string().max(100).required(),
  quantity: Joi.number().integer().min(0).optional().allow(null),
  unitPrice: Joi.number().precision(2).positive().required(),
  totalPrice: Joi.number().precision(2).positive().required(),
  status: Joi.string().valid(...validStatuses).required(),
  description: Joi.string().max(255).required(),
  purchaseDate: Joi.date().iso().required(),
  location: Joi.string().max(100).required(),
}).custom(validateQuantityVsPlate);

export const updateConsumableMaterialSchema = Joi.object({
  userId: Joi.number().integer().positive(),
  brandId: Joi.number().integer().positive(),
  senaPlate: Joi.string().max(20).allow('', null),
  materialName: Joi.string().max(100),
  quantity: Joi.number().integer().min(0).allow(null),
  unitPrice: Joi.number().precision(2).positive(),
  totalPrice: Joi.number().precision(2).positive(),
  status: Joi.string().valid(...validStatuses),
  description: Joi.string().max(255),
  purchaseDate: Joi.date().iso(),
  location: Joi.string().max(100),
}).min(1);

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
