import Joi from 'joi';

const validStatuses = ['Disponible', 'No_disponible', 'Mantenimiento', 'En_prestamo', 'Traslado', 'Baja'];

// La fecha de ingreso no puede ser anterior a la de compra: el material no puede
// entrar al almacén antes de existir. Se comparan como fecha de calendario porque
// ambas son columnas DATE sin hora.
const validateEntryVsPurchase = (value, helpers) => {
  const { purchaseDate, entryDate } = value;
  if (purchaseDate && entryDate && new Date(entryDate) < new Date(purchaseDate)) {
    return helpers.error('any.custom', {
      message: '"entryDate" no puede ser anterior a "purchaseDate".',
    });
  }
  return value;
};

// Listas serializadas como JSON dentro del multipart: un FormData no puede llevar
// un array. accountableIds son los cuentadantes; imageOrder y sheetOrder mezclan
// ids ya guardados con referencias "new:<i>" a los archivos recién subidos.
const jsonList = Joi.string().max(1000);

const validateQuantityVsPlate = (value, helpers) => {
  const { senaPlate, quantity } = value;
  if (!senaPlate && (quantity === undefined || quantity === null)) {
    return helpers.error('any.custom', { message: '"quantity" es obligatoria cuando no hay senaPlate.' });
  }
  return value;
};

export const createReturnableMaterialSchema = Joi.object({
  // (p48) Cuentadantes: uno o varios, ya no un userId suelto
  accountableIds: jsonList.required(),
  // (p50) Cotizaciones que respaldan el precio: entre 1 y 3. Aquí solo se
  // comprueba que el campo llegue y tenga forma de lista; cuántas son, si
  // existen y si están habilitadas lo decide quotationService, que es quien
  // puede consultarlo en la base de datos.
  quotationIds: jsonList.required(),
  // (p48) La marca dejó de ser obligatoria
  brandId:      Joi.number().integer().positive().optional().allow('', null),
  // (p48) El inventario SÍ es obligatorio
  inventoryId:  Joi.number().integer().positive().required(),
  senaPlate:    Joi.string().max(20).optional().allow('', null),
  materialName: Joi.string().max(100).required(),
  quantity:     Joi.number().integer().min(0).optional().allow(null),
  unitPrice:    Joi.number().precision(2).positive().required(),
  totalPrice:   Joi.number().precision(2).positive().required(),
  status:       Joi.string().valid(...validStatuses).required(),
  description:  Joi.string().max(255).required(),
  purchaseDate: Joi.date().iso().required(),
  // (p48) Fecha de ingreso al almacén, obligatoria
  entryDate:    Joi.date().iso().required(),
  location:     Joi.string().max(100).required(),
  categoryId:   Joi.number().integer().positive().required(),
  // (p48) modelo y serial pasaron a opcionales
  model:        Joi.string().max(100).optional().allow('', null),
  serial:       Joi.string().max(20).optional().allow('', null),
  dimensions:   Joi.string().max(100).optional().allow('', null),
})
  .custom(validateQuantityVsPlate)
  .custom(validateEntryVsPurchase);

export const updateReturnableMaterialSchema = Joi.object({
  accountableIds: jsonList,
  // (p50) Si no llega, la edición no tocó las cotizaciones
  quotationIds: jsonList,
  brandId:        Joi.number().integer().positive().allow('', null),
  inventoryId:    Joi.number().integer().positive(),
  senaPlate:      Joi.string().max(20).allow('', null),
  materialName:   Joi.string().max(100),
  // (p48) El vacío significa "no tiene cantidad", o sea material serializado: es
  // lo que permite convertir uno por cantidad en uno con placa SENA. El service
  // lo traduce a null. Antes el campo vacío se descartaba y la cantidad vieja se
  // quedaba pegada, dejando un material con placa Y cantidad — un estado que
  // rompe la invariante `quantity == null ⇔ serializado` de la que dependen
  // préstamos, retornos y devoluciones.
  quantity:       Joi.number().integer().min(0).allow('', null),
  unitPrice:      Joi.number().precision(2).positive(),
  totalPrice:     Joi.number().precision(2).positive(),
  status:         Joi.string().valid(...validStatuses),
  description:    Joi.string().max(255),
  purchaseDate:   Joi.date().iso(),
  entryDate:      Joi.date().iso(),
  location:       Joi.string().max(100),
  categoryId:     Joi.number().integer().positive(),
  model:          Joi.string().max(100).allow('', null),
  serial:         Joi.string().max(20).allow('', null),
  dimensions:     Joi.string().max(100).allow('', null),
  // Orden final de las fichas técnicas, serializado como JSON porque un
  // FormData no puede llevar un array. Mezcla ids ya guardados y referencias
  // "new:<i>" a los archivos recién subidos; lo que NO aparezca se elimina.
  sheetOrder:     jsonList.allow('', null),
  // (p48) Mismo contrato para las imágenes, que también son hasta 3
  imageOrder:     jsonList.allow('', null),
})
  .min(1)
  .custom(validateEntryVsPurchase);

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
