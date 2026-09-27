// Pruebas unitarias de createConsumableMaterialSchema — Matriz de Casos de Prueba v6,
// módulo Materiales de Consumo. Casos: 001-MCON y 002-MCON. Joi valida en memoria.
//
// Se verifica que la regla rechace el payload (tipo de error 'any.custom'), no el
// texto: las reglas personalizadas pasan su mensaje como { message } y la plantilla
// de Joi para 'any.custom' lo ignora, así que hoy el texto llega genérico
// ('"value" failed custom validation because '). Está reportado como defecto.
import { createConsumableMaterialSchema } from './consumableMaterial.validator.js';

// Campos tal como llegan de un FormData: los números viajan como texto y las
// listas (cuentadantes, cotizaciones) como JSON.
const payloadValido = {
  accountableIds: '[3]',
  quotationIds: '[1]',
  inventoryId: '1',
  materialName: 'Resma de papel oficio',
  quantity: '20',
  unitPrice: '24000',
  totalPrice: '480000',
  status: 'Disponible',
  description: 'Resma de 500 hojas tamaño oficio',
  purchaseDate: '2026-08-01',
  entryDate: '2026-08-05',
  location: 'Bodega 1',
};

describe('createConsumableMaterialSchema', () => {
  test('001-MCON: exige la cantidad cuando el material no tiene placa SENA', () => {
    const { quantity, ...sinCantidad } = payloadValido;

    const { error } = createConsumableMaterialSchema.validate(sinCantidad);

    expect(error).toBeDefined();
    expect(error.details).toHaveLength(1);
    expect(error.details[0].type).toBe('any.custom');
  });

  test('002-MCON: rechaza una fecha de ingreso anterior a la fecha de compra', () => {
    const { error } = createConsumableMaterialSchema.validate({
      ...payloadValido,
      purchaseDate: '2026-08-10',
      entryDate: '2026-08-01',
    });

    expect(error).toBeDefined();
    expect(error.details).toHaveLength(1);
    expect(error.details[0].type).toBe('any.custom');
  });
});
