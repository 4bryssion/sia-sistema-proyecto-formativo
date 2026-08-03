import Joi from 'joi';

export const createPermissionSchema = Joi.object({
  permissionName: Joi.string().max(150).required(),
  permissionCodename: Joi.string().max(100).required(),
  contentTypeId: Joi.number().integer().positive().optional().allow(null),
});

export const updatePermissionSchema = Joi.object({
  permissionName: Joi.string().max(150),
  permissionCodename: Joi.string().max(100),
  contentTypeId: Joi.number().integer().positive().allow(null),
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
