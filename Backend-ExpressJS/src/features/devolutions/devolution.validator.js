import Joi from 'joi';

const MATERIAL_STATUSES = ['Disponible', 'No_disponible', 'Mantenimiento', 'Traslado', 'Baja'];

// Registrar una devolución (fase 1: la solicita quien entrega el material).
//
// El TIPO (Total o Parcial) no lo manda el cliente: lo deduce el service
// comparando lo que se devuelve contra lo que queda pendiente en el préstamo.
// Si viniera del cliente, un formulario mal armado podría declarar "Total" una
// devolución que deja materiales sin devolver.
export const createDevolutionSchema = Joi.object({
  loanId: Joi.number().integer().positive().required(),
  items: Joi.array()
    .items(
      Joi.object({
        materialId: Joi.number().integer().positive().required(),
        // Unidades que regresan. 0 es válido: un consumible puede haberse
        // gastado por completo y no sobrar nada.
        returnedQuantity: Joi.number().integer().min(0).required(),
        requesterObservations: Joi.string().max(255).allow('', null),
      }),
    )
    .min(1)
    .required(),
});

// Autorizar (fase 2: lo hace un administrador o instructor cuentadante).
// Cada material devuelto necesita su estado final; las observaciones son
// opcionales, igual que en el retorno de una sola fase (RFADMIN22).
export const authorizeDevolutionSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().required(),
        materialStatus: Joi.string().valid(...MATERIAL_STATUSES).required(),
        authorizerObservations: Joi.string().max(255).allow('', null),
      }),
    )
    .min(1)
    .required(),
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
