import Joi from 'joi';

const baseSchema = {
  userFirstName: Joi.string().max(100),
  userLastName: Joi.string().max(100),
  documentTypeId: Joi.number().integer().positive(),
  userDocumentNumber: Joi.string().max(20),
  userEndDate: Joi.date().iso(),
  userEmail: Joi.string().email().lowercase().max(150),
  userPhone: Joi.string().max(15),
  userSecondPhone: Joi.string().max(15).allow('', null),
  userAddress: Joi.string().max(150),
  userIsActive: Joi.boolean(),
  userAccountType: Joi.string().valid('Solidario', 'Cuentadante'),
};

export const createUserSchema = Joi.object({
  ...baseSchema,
  userFirstName: baseSchema.userFirstName.required(),
  userLastName: baseSchema.userLastName.required(),
  documentTypeId: baseSchema.documentTypeId.required(),
  userDocumentNumber: baseSchema.userDocumentNumber.required(),
  userEndDate: baseSchema.userEndDate.required(),
  userEmail: baseSchema.userEmail.required(),
  userPhone: baseSchema.userPhone.required(),
  userAddress: baseSchema.userAddress.required(),
  userPassword: Joi.string().min(8).required(),
});

export const updateUserSchema = Joi.object({
  ...baseSchema,
  userPassword: Joi.string().min(8),
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

// Para PUT con multipart: omite .min(1) si solo se envía un archivo
export const validateUpdate = (schema) => (req, res, next) => {
  if (Object.keys(req.body).length === 0 && req.file) return next();
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Error de validación.',
      detalles: error.details.map((d) => d.message),
    });
  }
  next();
};
