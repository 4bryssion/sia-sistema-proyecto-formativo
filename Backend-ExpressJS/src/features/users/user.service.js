import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { userRepository } from './user.repository.js';
import { sendUserCredentials, classifyMailError } from '../../config/mailer.js';
import { notify } from '../notifications/notification.service.js';

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
  async getAll(status) {
    return userRepository.findAll(status);
  },

  async getById(id) {
    const usuario = await userRepository.findById(id);
    if (!usuario) throw new Error('Usuario no encontrado.');
    return usuario;
  },

  async create(bodyData, file) {
    if (!file) throw new Error('La foto es requerida.');

    const data = { ...bodyData };

    const groupId = Number(data.groupId);
    delete data.groupId;

    data.userPhoto = `/uploads/${file.filename}`;
    data.documentTypeId = Number(data.documentTypeId);
    // Instructor de planta: sin fecha de finalización. La columna es nullable
    // (p44), pero Prisma no acepta '' en un DateTime — hay que mandar null.
    data.userEndDate = data.userEndDate ? new Date(data.userEndDate) : null;

    // '' → null: la columna es única y dos usuarios con '' chocarían (NULL sí se repite)
    if (data.userEmailInstitutional === '') data.userEmailInstitutional = null;

    if (data.userEmailInstitutional && data.userEmailInstitutional === data.userEmail) {
      throw new Error('El correo institucional no puede ser igual al personal.');
    }

    // La contraseña en texto plano solo existe aquí (antes del hash); es la única
    // oportunidad de enviarla por correo — después es irrecuperable (bcrypt)
    const plainPassword = data.userPassword;
    data.userPassword = await bcrypt.hash(data.userPassword, SALT_ROUNDS);

    let user;
    try {
      user = await userRepository.createWithGroup(data, groupId);
    } catch (err) {
      deleteFile(data.userPhoto);
      throw err;
    }

    // Envío de credenciales al correo PERSONAL (no institucional). Es síncrono para
    // poder reportar el resultado en la respuesta, pero un fallo del correo NO
    // deshace la creación del usuario.
    let emailSent = false;
    let emailError = null; // 'invalid_recipient' | 'service_error'
    try {
      await sendUserCredentials(user.userEmail, {
        name: `${user.userFirstName} ${user.userLastName}`,
        email: user.userEmail,
        password: plainPassword,
      });
      emailSent = true;
    } catch (err) {
      emailError = classifyMailError(err);
      console.error('Error enviando credenciales:', err.message);
    }

    // (P43) Log del sistema: creación de usuario (+ resultado del correo de credenciales)
    notify({
      title: 'Usuario creado',
      description: `Se creó el usuario ${user.userFirstName} ${user.userLastName} (${user.userEmail}). Correo de credenciales: ${emailSent ? 'enviado' : `falló (${emailError})`}.`,
      severity: emailSent ? 'Informativa' : 'Advertencia',
      module: 'users',
    });

    return { user, emailSent, emailError };
  },

  async update(id, bodyData, file) {
    const currentUser = await userService.getById(id);

    const data = { ...bodyData };

    if (file) data.userPhoto = `/uploads/${file.filename}`;
    if (data.userPassword) data.userPassword = await bcrypt.hash(data.userPassword, SALT_ROUNDS);
    if (data.documentTypeId) data.documentTypeId = Number(data.documentTypeId);
    // Igual que en create: '' (campo vacío del formulario) debe viajar como null,
    // no como cadena vacía, o Prisma rechaza el DateTime
    if (data.userEndDate !== undefined) {
      data.userEndDate = data.userEndDate ? new Date(data.userEndDate) : null;
    }

    // '' → null: mismo motivo que en create (unique con NULLs repetibles)
    if (data.userEmailInstitutional === '') data.userEmailInstitutional = null;

    const personal = data.userEmail ?? currentUser.userEmail;
    if (data.userEmailInstitutional && data.userEmailInstitutional === personal) {
      throw new Error('El correo institucional no puede ser igual al personal.');
    }

    delete data.groupId;
    delete data.isActive;

    try {
      const resultado = await userRepository.update(id, data);
      if (file && currentUser.userPhoto) deleteFile(currentUser.userPhoto);
      notify({
        title: 'Usuario modificado',
        description: `Se actualizaron los datos del usuario ${resultado.userFirstName} ${resultado.userLastName}.`,
        module: 'users',
      });
      return resultado;
    } catch (err) {
      if (file) deleteFile(data.userPhoto);
      throw err;
    }
  },

  async toggle(id) {
    const record = await userService.getById(id);
    const updated = await userRepository.toggle(id, !record.isActive);
    notify({
      title: updated.isActive ? 'Usuario activado' : 'Usuario desactivado',
      description: `${updated.userFirstName} ${updated.userLastName} quedó ${updated.isActive ? 'activo' : 'inactivo'}.`,
      severity: updated.isActive ? 'Informativa' : 'Advertencia',
      module: 'users',
    });
    return updated;
  },
};
