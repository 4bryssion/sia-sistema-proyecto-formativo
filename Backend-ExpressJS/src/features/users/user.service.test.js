// Pruebas unitarias de userService — Matriz de Casos de Prueba v6, módulo Usuarios.
// Casos: 002-USR y 003-USR (tabla "Pruebas unitarias").
// El repository y el mailer se simulan: no se toca la base de datos ni se envían correos.
import { userService } from './user.service.js';
import { userRepository } from './user.repository.js';

jest.mock('./user.repository.js');
jest.mock('../../config/mailer.js');

const hoyISO = () => new Date().toLocaleDateString('en-CA');

describe('userService', () => {
  test('002-USR: create() rechaza una fecha de finalización anterior a la de inicio sin crear el usuario', async () => {
    const payload = {
      userFirstName: 'Sofía',
      userLastName: 'Cardona',
      documentTypeId: '1',
      userDocumentNumber: '1020304050',
      userStartDate: '2026-10-01',
      userEndDate: '2026-09-01',
      dataPolicyAccepted: 'true',
      userEmail: 'pruebas.sii+nuevo@gmail.com',
      userPhone: '3001234567',
      userAddress: 'Calle 10 # 20-30',
      userPassword: 'Temporal123*',
      groupId: '4',
    };

    await expect(userService.create(payload, undefined)).rejects.toThrow(
      'La fecha de finalización no puede ser anterior a la de inicio.',
    );
    expect(userRepository.createWithGroup).not.toHaveBeenCalled();
  });

  test('003-USR: toggle() al desactivar un usuario con vigencia futura adelanta su fecha de finalización a hoy', async () => {
    userRepository.findById.mockResolvedValue({
      id: 5,
      isActive: true,
      userStartDate: new Date('2026-01-01'),
      userEndDate: new Date('2030-12-31'),
    });
    userRepository.toggle.mockResolvedValue({ id: 5, isActive: false });

    await userService.toggle(5, {});

    expect(userRepository.toggle).toHaveBeenCalledWith(5, false, { userEndDate: new Date(hoyISO()) });
  });
});
