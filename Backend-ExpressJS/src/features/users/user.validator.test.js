// Prueba unitaria de createUserSchema — Matriz de Casos de Prueba v6, módulo Usuarios.
// Caso: 001-USR (tabla "Pruebas unitarias"). Joi valida en memoria: no hay mocks.
import { createUserSchema } from './user.validator.js';

const payloadValido = {
  userFirstName: 'Sofía',
  userLastName: 'Cardona',
  documentTypeId: 1,
  userDocumentNumber: '1020304050',
  userStartDate: '2026-09-01',
  userEndDate: '2027-09-01',
  dataPolicyAccepted: true,
  userEmail: 'pruebas.sii+nuevo@gmail.com',
  userPhone: '3001234567',
  userAddress: 'Calle 10 # 20-30',
  userPassword: 'Temporal123*',
  groupId: 4,
};

describe('createUserSchema', () => {
  test('001-USR: rechaza la creación cuando no se acepta el tratamiento de datos personales', () => {
    const { error } = createUserSchema.validate({ ...payloadValido, dataPolicyAccepted: false }, { abortEarly: false });

    expect(error).toBeDefined();
    expect(error.details).toHaveLength(1);
    expect(error.details[0].path).toEqual(['dataPolicyAccepted']);
  });
});
