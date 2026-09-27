// Prueba unitaria de authenticateToken — Matriz de Casos de Prueba v6, módulo Auth.
// Caso: 004-AUTH (tabla "Pruebas unitarias").
//
// El token se firma de verdad con el JWT_SECRET ficticio de jest.setup.cjs; lo
// que se simula es el estado de la sesión que el middleware lee de la base.
import jwt from 'jsonwebtoken';
import { authenticateToken } from './auth.middleware.js';
import { authRepository } from '../features/auth/auth.repository.js';

jest.mock('../features/auth/auth.repository.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticateToken', () => {
  test('004-AUTH: con contraseña temporal sin cambiar bloquea con 403 cualquier ruta distinta de cambiar contraseña', async () => {
    const jti = 'jti-sesion-activa';
    const token = jwt.sign({ id: 12, email: 'pruebas.sii+temporal.api@gmail.com', jti }, process.env.JWT_SECRET);
    authRepository.findSessionState.mockResolvedValue({
      id: 12,
      isActive: true,
      activeSessionJti: jti,
      activeSessionExpiresAt: new Date(Date.now() + 4 * 60 * 1000),
      mustChangePassword: true,
    });
    const req = { headers: { authorization: `Bearer ${token}` }, originalUrl: '/api/users?status=all' };
    const res = mockRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Debes cambiar tu contraseña temporal antes de usar el sistema.',
      mustChangePassword: true,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
