import Joi from 'joi';

const validStatuses = ['Disponible', 'No_disponible', 'Mantenimiento', 'En_prestamo', 'Traslado', 'Baja'];

export const createReturnableMaterialSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  brandId: Joi.number().integer().positive().required(),
  senaPlate: Joi.string().max(20).optional().allow('', null),
  materialName: Joi.string().max(100).required(),
  unitPrice: Joi.number().precision(2).positive().required(),
  totalPrice: Joi.number().precision(2).positive().required(),
  status: Joi.string().valid(...validStatuses).required(),
  description: Joi.string().max(255).required(),
  purchaseDate: Joi.date().iso().required(),
  location: Joi.string().max(100).required(),

  categoryId: Joi.number().integer().positive().required(),
  model: Joi.string().max(100).required(),
  serial: Joi.string().max(20).required(),
  dimensions: Joi.string().max(100).optional().allow('', null),
});

export const updateReturnableMaterialSchema = Joi.object({
  userId: Joi.number().integer().positive(),
  brandId: Joi.number().integer().positive(),
  senaPlate: Joi.string().max(20).allow('', null),
  materialName: Joi.string().max(100),
  unitPrice: Joi.number().precision(2).positive(),
  totalPrice: Joi.number().precision(2).positive(),
  status: Joi.string().valid(...validStatuses),
  description: Joi.string().max(255),
  purchaseDate: Joi.date().iso(),
  location: Joi.string().max(100),

  categoryId: Joi.number().integer().positive(),
  model: Joi.string().max(100),
  serial: Joi.string().max(20),
  technicalSheet: Joi.string().max(255).allow('', null),
  dimensions: Joi.string().max(100).allow('', null),
}).min(1);

export const validate = (schema) => (req, res, next) => {
  const tieneArchivos = req.files && Object.keys(req.files).length > 0;
  const tieneBody = Object.keys(req.body).length > 0;

  // Actualización solo con archivos: el body está vacío pero hay files → válido
  if (!tieneBody && tieneArchivos) return next();

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Error de validación.',
      detalles: error.details.map((d) => d.message),
    });
  }
  next();
};
