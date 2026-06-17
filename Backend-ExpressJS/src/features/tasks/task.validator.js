import Joi from 'joi';

export const createTaskSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  taskName: Joi.string().max(100).required(),
  description: Joi.string().max(255).required(),
  status: Joi.boolean().default(true),
});

export const updateTaskSchema = Joi.object({
  userId: Joi.number().integer().positive(),
  taskName: Joi.string().max(100),
  description: Joi.string().max(255),
  status: Joi.boolean(),
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
