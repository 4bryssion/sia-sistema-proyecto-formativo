import Joi from 'joi';

export const TASK_STATUSES = ['en_progreso', 'completada', 'no_completada'];

export const createTaskSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  taskName: Joi.string().max(100).required(),
  description: Joi.string().max(255).required(),
  endDate: Joi.date().iso().required(),
  status: Joi.string().valid(...TASK_STATUSES).default('en_progreso'),
});

// RFADMIN49: NO se puede reasignar usuario → userId NO está permitido en update.
export const updateTaskSchema = Joi.object({
  taskName: Joi.string().max(100),
  description: Joi.string().max(255),
  endDate: Joi.date().iso(),
  status: Joi.string().valid(...TASK_STATUSES),
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
