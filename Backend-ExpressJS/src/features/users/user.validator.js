import Joi from 'joi';

const baseSchema = {
  userFirstName: Joi.string().max(100),
  userLastName: Joi.string().max(100),
  documentTypeId: Joi.number().integer().positive(),
  userDocumentNumber: Joi.string().max(20),
  // (p48) Vigencia del vínculo. La de inicio SÍ admite fechas pasadas (se puede
  // registrar a alguien que ya venía trabajando); la de finalización no puede ser
  // anterior a la de inicio, y eso se comprueba en el service, que es donde se
  // conoce el valor guardado en una edición parcial.
  userStartDate: Joi.date().iso(),
  userEndDate: Joi.date().iso(),
  userEmail: Joi.string().email({ tlds: { allow: false } }).lowercase().max(150),
  userEmailInstitutional: Joi.string().email({ tlds: { allow: false } }).lowercase().max(150).allow('', null),
  userPhone: Joi.string().max(15),
  userSecondPhone: Joi.string().max(15).allow('', null),
  userAddress: Joi.string().max(150),
  userAccountType: Joi.string().valid('Solidario', 'Cuentadante'),
};

export const createUserSchema = Joi.object({
  ...baseSchema,
  userFirstName: baseSchema.userFirstName.required(),
  userLastName: baseSchema.userLastName.required(),
  documentTypeId: baseSchema.documentTypeId.required(),
  userDocumentNumber: baseSchema.userDocumentNumber.required(),
  // (p48) Las dos fechas son obligatorias: se eliminó la excepción de "instructor
  // de planta", que era lo único que permitía dejar la finalización vacía.
  userStartDate: baseSchema.userStartDate.required(),
  userEndDate: baseSchema.userEndDate.required(),
  // (p48) Tratamiento de datos personales: sin aceptar, no se crea el usuario.
  // `valid(true)` en vez de `boolean().required()` para que un `false` explícito
  // se rechace en la validación y no llegue al service como un caso más.
  dataPolicyAccepted: Joi.boolean().valid(true).required(),
  userEmail: baseSchema.userEmail.required(),
  userPhone: baseSchema.userPhone.required(),
  userAddress: baseSchema.userAddress.required(),
  userPassword: Joi.string().min(8).required(),
  groupId: Joi.number().integer().positive().required(),
});

export const updateUserSchema = Joi.object({
  ...baseSchema,
  userPassword: Joi.string().min(8),
}).min(1);

// (p48) El toggle dejó de tener el body vacío: al REACTIVAR hay que mandar la
// nueva vigencia. Al desactivar el body va vacío y por eso ningún campo es
// obligatorio aquí; que estén presentes al reactivar lo exige el service, que es
// quien sabe hacia qué estado va el usuario.
export const toggleUserSchema = Joi.object({
  userStartDate: Joi.date().iso(),
  userEndDate: Joi.date().iso(),
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
