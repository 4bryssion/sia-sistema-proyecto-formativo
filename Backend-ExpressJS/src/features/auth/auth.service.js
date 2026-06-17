import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';

const authError = (msg) => {
  const err = new Error(msg);
  err.statusCode = 401;
  return err;
};

export const authService = {
  async login({ email, password }) {
    const user = await authRepository.findByEmail(email);

    if (!user) throw authError('Credenciales inválidas');

    const isMatch = await bcrypt.compare(password, user.userPassword);
    if (!isMatch) throw authError('Credenciales inválidas');

    if (!user.userIsActive) throw authError('Usuario no disponible');
    if (!user.userStatus)   throw authError('Usuario inactivo');

    const token = jwt.sign(
      { id: user.id, email: user.userEmail },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES },
    );

    return {
      token,
      user: { id: user.id, email: user.userEmail },
    };
  },
};
