// Pruebas unitarias de authService.login — Matriz de Casos de Prueba v6, módulo Auth.
// Casos: 001-AUTH, 002-AUTH y 003-AUTH (tabla "Pruebas unitarias").
//
// No tocan la base de datos ni el correo: el repository, bcrypt y el mailer se
// reemplazan por simulaciones (jest.mock) y cada prueba decide qué devuelven.
import { authService } from './auth.service.js';
import { authRepository } from './auth.repository.js';
import bcrypt from 'bcrypt';

jest.mock('./auth.repository.js');
jest.mock('bcrypt');
jest.mock('../../config/mailer.js');

const DIA_MS = 24 * 60 * 60 * 1000;

// Usuario tal como lo devuelve authRepository.findByEmail: activo, con vigencia
// en curso, sin sesión abierta y sin contraseña temporal.
const usuarioBase = (cambios = {}) => ({
  id: 2,
  userEmail: 'pruebas.sii+admin.ui@gmail.com',
  userPassword: '$2b$10$hashSimulado',
  isActive: true,
  activeSessionJti: null,
  activeSessionExpiresAt: null,
  userStartDate: new Date(Date.now() - 30 * DIA_MS),
  userEndDate: new Date(Date.now() + 365 * DIA_MS),
  mustChangePassword: false,
  ...cambios,
});

const credenciales = { email: 'pruebas.sii+admin.ui@gmail.com', password: 'Prueba123*' };

describe('authService.login', () => {
  test('001-AUTH: con credenciales válidas y usuario habilitado devuelve token, usuario y abre la sesión', async () => {
    authRepository.findByEmail.mockResolvedValue(usuarioBase());
    bcrypt.compare.mockResolvedValue(true);
    authRepository.setActiveSession.mockResolvedValue({});

    const resultado = await authService.login(credenciales);

    expect(resultado).toEqual({
      token: expect.any(String),
      user: { id: 2, email: 'pruebas.sii+admin.ui@gmail.com' },
      mustChangePassword: false,
    });
    expect(authRepository.setActiveSession).toHaveBeenCalledWith(2, expect.any(String), expect.any(Date));
  });

  test('002-AUTH: rechaza con "Usuario inactivo" (401) solo después de comprobar la contraseña', async () => {
    authRepository.findByEmail.mockResolvedValue(usuarioBase({ isActive: false }));
    bcrypt.compare.mockResolvedValue(true);

    await expect(authService.login(credenciales)).rejects.toMatchObject({
      message: 'Usuario inactivo',
      statusCode: 401,
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('Prueba123*', '$2b$10$hashSimulado');
    expect(authRepository.setActiveSession).not.toHaveBeenCalled();
  });

  test('003-AUTH: rechaza con 409 cuando la cuenta ya tiene una sesión viva (sesión única)', async () => {
    authRepository.findByEmail.mockResolvedValue(usuarioBase({
      activeSessionJti: 'jti-de-otra-ventana',
      activeSessionExpiresAt: new Date(Date.now() + 3 * 60 * 1000),
    }));
    bcrypt.compare.mockResolvedValue(true);

    await expect(authService.login(credenciales)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('Ya tienes una sesión abierta'),
    });
    expect(authRepository.setActiveSession).not.toHaveBeenCalled();
  });
});
