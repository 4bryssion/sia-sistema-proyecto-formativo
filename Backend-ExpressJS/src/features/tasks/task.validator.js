import Joi from 'joi';

export const TASK_STATUSES = ['en_progreso', 'completada', 'no_completada'];

export const createTaskSchema = Joi.object({
  // (p51) Una lista SIEMPRE, también con un solo encargado: así no hay dos
  // formas de crear una tarea —una individual y otra múltiple— que tendrían que
  // mantenerse en paralelo. `unique()` rechaza la misma persona dos veces, que
  // el índice único de la tabla rechazaría de todas formas con un error de base
  // de datos en vez de un mensaje legible.
  userIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .unique()
    .required()
    .messages({
      'array.min': 'Indique al menos un encargado para la tarea.',
      'array.unique': 'Hay un encargado repetido en la lista.',
      'any.required': 'Indique al menos un encargado para la tarea.',
    }),
  taskName: Joi.string().max(100).required(),
  description: Joi.string().max(255).required(),
  endDate: Joi.date().iso().required(),
  // El estado no se elige al crear: toda asignación nace en progreso. Dejarlo
  // entrar permitiría crear una tarea ya completada, que no significa nada.
});

// RFADMIN49: NO se puede reasignar usuario → userIds NO está permitido en update.
// (p51) `status` tampoco: el estado es de cada asignación y se cambia por
// PATCH /:id/status, que sabe de quién es el que se toca.
export const updateTaskSchema = Joi.object({
  taskName: Joi.string().max(100),
  description: Joi.string().max(255),
  endDate: Joi.date().iso(),
  // (p51) Los encargados SÍ se pueden cambiar al editar. Antes no: el service
  // los descartaba citando un RFADMIN49 que no existe en el documento de
  // requerimientos —ahí los RFADMIN llegan al 45 y no hay ninguno de tareas—.
  // Al menos uno: una tarea sin encargados no es de nadie.
  userIds: Joi.array().items(Joi.number().integer().positive()).min(1).unique(),
}).min(1);

// (p50) Cambio de estado a secas. `no_completada` NO se acepta: lo pone el
// vencimiento automático, no una persona.
export const statusTaskSchema = Joi.object({
  status: Joi.string().valid('en_progreso', 'completada').required(),
  // (p51) De quién es el estado. Ausente = el propio, que es el caso del
  // aprendiz marcando su casilla. Presente y de otra persona, hace falta
  // `edit_task`, y eso lo comprueba el service.
  userId: Joi.number().integer().positive(),
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
