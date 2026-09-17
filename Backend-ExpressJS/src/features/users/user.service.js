import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { userRepository } from './user.repository.js';
import { sendUserCredentials, sendUserReactivated, classifyMailError } from '../../config/mailer.js';
import { notify } from '../notifications/notification.service.js';

const SALT_ROUNDS = 10;

// Fecha de calendario de HOY como 'YYYY-MM-DD'. Se compara como texto contra las
// columnas DATE para esquivar el bug transversal del proyecto: new Date('YYYY-MM-DD')
// parsea en UTC y en UTC-5 desplaza el día.
const hoyISO = () => new Date().toLocaleDateString('en-CA');
const aISO = (fecha) => new Date(fecha).toLocaleDateString('en-CA', { timeZone: 'UTC' });

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
    const data = { ...bodyData };

    const groupId = Number(data.groupId);
    delete data.groupId;

    // (p48) La foto dejó de ser obligatoria: sin ella la interfaz muestra un
    // icono de usuario. Solo se asigna la columna si llegó archivo, porque un
    // string vacío rompería el índice único (varios NULL sí conviven).
    if (file) data.userPhoto = `/uploads/${file.filename}`;
    data.documentTypeId = Number(data.documentTypeId);

    // (p48) Tratamiento de datos personales (Ley 1581 de 2012). El formulario
    // manda un booleano; en BD se guarda CUÁNDO se aceptó, porque un "sí" sin
    // fecha no sirve como evidencia de consentimiento.
    const acepto = data.dataPolicyAccepted === true || data.dataPolicyAccepted === 'true';
    delete data.dataPolicyAccepted;
    if (!acepto) throw new Error('Debe aceptarse el tratamiento de datos personales.');
    data.dataPolicyAcceptedAt = new Date();

    // (p48) Las dos fechas son obligatorias: se eliminó la excepción de
    // "instructor de planta" que dejaba la finalización vacía.
    //
    // Joi comprueba el formato de cada una pero no su relación, así que la
    // coherencia se valida aquí — igual que ya se hacía en `update` y en
    // `toggle`. Sin esto, crear un usuario con la vigencia al revés se aceptaba
    // y nacía inaccesible: la tarea diaria lo desactivaría esa misma noche.
    if (aISO(data.userEndDate) < aISO(data.userStartDate)) {
      deleteFile(file ? `/uploads/${file.filename}` : null);
      throw new Error('La fecha de finalización no puede ser anterior a la de inicio.');
    }
    data.userStartDate = new Date(data.userStartDate);
    data.userEndDate = new Date(data.userEndDate);

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
        // (p48) El correo avisa desde cuándo podrá entrar: si la fecha de inicio
        // es futura, el login lo rechazará y sin este aviso pensaría que sus
        // credenciales están mal.
        startDate: user.userStartDate,
        endDate: user.userEndDate,
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
    // (p48) Las dos fechas son obligatorias, así que un campo vacío ya no puede
    // significar null: se rechaza en vez de borrar la vigencia en silencio.
    for (const campo of ['userStartDate', 'userEndDate']) {
      if (data[campo] !== undefined) {
        if (!data[campo]) throw new Error('Las fechas de inicio y finalización son obligatorias.');
        data[campo] = new Date(data[campo]);
      }
    }
    // La vigencia debe seguir teniendo sentido tras la edición: se compara contra
    // lo que quede guardado, no solo contra lo que llegó en esta petición.
    const inicioFinal = aISO(data.userStartDate ?? currentUser.userStartDate);
    const finFinal    = aISO(data.userEndDate   ?? currentUser.userEndDate);
    if (finFinal < inicioFinal) {
      throw new Error('La fecha de finalización no puede ser anterior a la de inicio.');
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

  // (p48) El toggle dejó de ser un simple cambio de bandera porque la vigencia y
  // el estado tienen que contar la misma historia:
  //
  // - Desactivar ANTES de la fecha de finalización la adelanta a hoy. Si no, el
  //   usuario quedaría inactivo con una vigencia que dice que sigue vinculado, y
  //   la tarea programada no tendría forma de distinguirlo de un caso pendiente.
  // - Reactivar EXIGE fechas nuevas: la vigencia anterior ya se agotó (o se
  //   adelantó al desactivarlo), así que reactivar sin fechas dejaría una cuenta
  //   activa que el login rechazaría de inmediato por vencida.
  async toggle(id, fechas = {}) {
    const record = await userService.getById(id);
    const activando = !record.isActive;

    let cambios = {};

    if (activando) {
      const { userStartDate, userEndDate } = fechas;
      if (!userStartDate || !userEndDate) {
        throw new Error('Para reactivar el usuario debe indicar la nueva fecha de inicio y de finalización.');
      }
      const inicio = aISO(userStartDate);
      const fin    = aISO(userEndDate);
      if (fin < inicio) {
        throw new Error('La fecha de finalización no puede ser anterior a la de inicio.');
      }
      // La finalización sí debe ser futura: reactivar con una fecha ya vencida
      // dejaría al usuario activo pero sin poder entrar, y la tarea programada
      // volvería a desactivarlo esa misma noche.
      if (fin < hoyISO()) {
        throw new Error('La fecha de finalización no puede ser anterior a hoy.');
      }
      cambios = { userStartDate: new Date(userStartDate), userEndDate: new Date(userEndDate) };
    } else if (aISO(record.userEndDate) > hoyISO()) {
      cambios = { userEndDate: new Date(hoyISO()) };
    }

    const updated = await userRepository.toggle(id, activando, cambios);

    // El correo de reactivación se envía DESPUÉS de confirmar el cambio y sin
    // await: igual que el de firma de préstamos, un fallo de correo no debe
    // deshacer una operación que ya quedó en BD.
    if (activando) {
      sendUserReactivated(updated.userEmail, {
        name: `${updated.userFirstName} ${updated.userLastName}`,
        startDate: updated.userStartDate,
        endDate: updated.userEndDate,
      }).catch((err) => console.error('Error enviando correo de reactivación:', err.message));
    }

    notify({
      title: updated.isActive ? 'Usuario activado' : 'Usuario desactivado',
      description:
        `${updated.userFirstName} ${updated.userLastName} quedó ${updated.isActive ? 'activo' : 'inactivo'}` +
        (activando
          ? ` con vigencia del ${aISO(updated.userStartDate)} al ${aISO(updated.userEndDate)}.`
          : cambios.userEndDate
            ? '. Su fecha de finalización se adelantó a hoy.'
            : '.'),
      severity: updated.isActive ? 'Informativa' : 'Advertencia',
      module: 'users',
    });
    return updated;
  },

  // (p48) Desactivación automática por vigencia vencida. La ejecuta la tarea
  // programada diaria (src/shared/dailyTasks.js), no una petición HTTP.
  async deactivateExpired() {
    const vencidos = await userRepository.findExpired(new Date(hoyISO()));
    if (!vencidos.length) return { total: 0, usuarios: [] };

    await userRepository.deactivateMany(vencidos.map((u) => u.id));

    // Un aviso por usuario y no uno agregado: el listado de notificaciones se
    // consulta por persona, y "se desactivaron 4 usuarios" no dice cuáles.
    for (const u of vencidos) {
      notify({
        title: 'Usuario desactivado automáticamente',
        description: `${u.userFirstName} ${u.userLastName} quedó inactivo: su vínculo finalizó el ${aISO(u.userEndDate)}.`,
        severity: 'Advertencia',
        module: 'users',
      });
    }
    return { total: vencidos.length, usuarios: vencidos };
  },
};
