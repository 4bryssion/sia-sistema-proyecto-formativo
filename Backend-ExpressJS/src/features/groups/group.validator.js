import Joi from 'joi';

export const createGroupSchema = Joi.object({
  groupName: Joi.string().max(100).required(),
});

export const updateGroupSchema = Joi.object({
  groupName: Joi.string().max(100),
}).min(1);

export const assignPermissionSchema = Joi.object({
  permissionId: Joi.number().integer().positive().required(),
});

// Reemplazo atómico del set de permisos — array de IDs positivos, puede ser vacío (quita todos)
export const updatePermissionsSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.number().integer().positive()).required(),
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
