// Prueba unitaria de createLoanSchema — Matriz de Casos de Prueba v6, módulo Préstamos.
// Caso: 005-PRE. Joi valida en memoria: no hay mocks.
import { createLoanSchema } from './loan.validator.js';

const fechaFutura = () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe('createLoanSchema', () => {
  test('005-PRE: rechaza un receptor indicado a la vez como usuario registrado y como correo externo', () => {
    const { error } = createLoanSchema.validate({
      loanType: 'Interno',
      useJustification: 'Práctica de laboratorio',
      returnDate: fechaFutura(),
      lenderId: 3,
      receiverId: 5,
      receiverEmail: 'externo@empresa.com',
      materials: [{ materialId: 1, borrowedQuantity: 2 }],
    });

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Indique el receptor: un usuario registrado o un correo electrónico, no ambos.');
  });
});
