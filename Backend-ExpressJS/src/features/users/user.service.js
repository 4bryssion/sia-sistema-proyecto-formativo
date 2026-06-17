import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { userRepository } from './user.repository.js';

const SALT_ROUNDS = 10;

const deleteFile = (filePath) => {
  if (filePath) {
    const rutaCompleta = path.join('uploads', path.basename(filePath));
    fs.unlink(rutaCompleta, (err) => {
      if (err) console.error('Error eliminando archivo:', err);
    });
  }
};

export const userService = {
  async getAll() {
    return userRepository.findAll();
  },

  async getById(id) {
    const usuario = await userRepository.findById(id);
    if (!usuario) throw new Error('Usuario no encontrado.');
    return usuario;
  },

  async create(bodyData, file) {
    if (!file) throw new Error('La foto es requerida.');

    const data = { ...bodyData };

    data.userPhoto = `/uploads/${file.filename}`;
    data.documentTypeId = Number(data.documentTypeId);

    if (data.userEndDate) data.userEndDate = new Date(data.userEndDate);

    data.userPassword = await bcrypt.hash(data.userPassword, SALT_ROUNDS);

    try {
      return await userRepository.create(data);
    } catch (err) {
      deleteFile(data.userPhoto);
      throw err;
    }
  },

  async update(id, bodyData, file) {
    const currentUser = await userService.getById(id);

    const data = { ...bodyData };

    if (file) data.userPhoto = `/uploads/${file.filename}`;

    if (data.userPassword) {
      data.userPassword = await bcrypt.hash(data.userPassword, SALT_ROUNDS);
    }

    if (data.documentTypeId) data.documentTypeId = Number(data.documentTypeId);
    if (data.userEndDate) data.userEndDate = new Date(data.userEndDate);

    // userStatus: campo de cuenta habilitada (gestionado vía PUT)
    if (data.userStatus !== undefined) {
      data.userStatus = data.userStatus === true || data.userStatus === 'true';
    }

    // userIsActive NO se actualiza por PUT — se gestiona exclusivamente vía PATCH /:id/toggle
    delete data.userIsActive;

    try {
      const resultado = await userRepository.update(id, data);
      if (file && currentUser.userPhoto) deleteFile(currentUser.userPhoto);
      return resultado;
    } catch (err) {
      if (file) deleteFile(data.userPhoto);
      throw err;
    }
  },

  async toggle(id) {
    const record = await userService.getById(id);
    return userRepository.toggle(id, !record.userIsActive);
  },
};
