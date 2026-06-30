import path from 'path';
import fs from 'fs';
import { returnableMaterialRepository } from './returnableMaterial.repository.js';

const deleteFiles = (archivos) => {
  archivos.forEach((filePath) => {
    if (filePath) {
      const ruta = path.join('uploads', path.basename(filePath));
      fs.unlink(ruta, (err) => {
        if (err) console.error('Error eliminando archivo:', err);
      });
    }
  });
};

const parseCampos = (body) => ({
  ...body,
  userId:      body.userId      ? Number(body.userId)      : undefined,
  brandId:     body.brandId     ? Number(body.brandId)     : undefined,
  categoryId:  body.categoryId  ? Number(body.categoryId)  : undefined,
  unitPrice:   body.unitPrice   ? Number(body.unitPrice)   : undefined,
  totalPrice:  body.totalPrice  ? Number(body.totalPrice)  : undefined,
  purchaseDate: body.purchaseDate ? new Date(body.purchaseDate).toISOString() : undefined,
  quantity:    body.quantity !== undefined && body.quantity !== ''
                 ? Number(body.quantity)
                 : undefined,
});

const separar = (data) => {
  const camposDevolutivo = ['categoryId', 'model', 'serial', 'technicalSheet', 'dimensions'];
  const devolutivo = {};
  const consumo = {};

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (camposDevolutivo.includes(key)) devolutivo[key] = val;
      else consumo[key] = val;
    }
  }

  return { consumo, devolutivo };
};

export const returnableMaterialService = {
  async getAll(status = 'active') {
    return returnableMaterialRepository.findAll(status);
  },

  async getById(id) {
    const material = await returnableMaterialRepository.findById(id);
    if (!material) throw new Error('Material devolutivo no encontrado.');
    return material;
  },

  async create(bodyData, files) {
    const imagen = files?.image?.[0];
    const fichaTecnica = files?.technical_sheet?.[0];

    if (!imagen) {
      if (fichaTecnica) deleteFiles([`/uploads/${fichaTecnica.filename}`]);
      throw new Error('La imagen es requerida.');
    }
    if (!fichaTecnica) {
      deleteFiles([`/uploads/${imagen.filename}`]);
      throw new Error('La ficha técnica es requerida.');
    }

    const data = parseCampos(bodyData);
    data.image = `/uploads/${imagen.filename}`;
    data.technicalSheet = `/uploads/${fichaTecnica.filename}`;

    const { consumo, devolutivo } = separar(data);

    try {
      return await returnableMaterialRepository.create(consumo, devolutivo);
    } catch (err) {
      deleteFiles([data.image, data.technicalSheet]);
      throw err;
    }
  },

  async update(id, bodyData, files) {
    const currentMaterial = await returnableMaterialService.getById(id);

    const data = parseCampos(bodyData);
    if (files?.image?.[0]) data.image = `/uploads/${files.image[0].filename}`;
    if (files?.technical_sheet?.[0]) data.technicalSheet = `/uploads/${files.technical_sheet[0].filename}`;

    const { consumo, devolutivo } = separar(data);

    try {
      const resultado = await returnableMaterialRepository.update(id, consumo, devolutivo);
      if (files?.image?.[0] && currentMaterial.consumableMaterial?.image)
        deleteFiles([currentMaterial.consumableMaterial.image]);
      if (files?.technical_sheet?.[0] && currentMaterial.technicalSheet)
        deleteFiles([currentMaterial.technicalSheet]);
      return resultado;
    } catch (err) {
      if (files?.image?.[0]) deleteFiles([data.image]);
      if (files?.technical_sheet?.[0]) deleteFiles([data.technicalSheet]);
      throw err;
    }
  },

  async toggle(id) {
    const record = await returnableMaterialService.getById(id);
    const currentIsActive = record.consumableMaterial.isActive;
    return returnableMaterialRepository.toggle(id, !currentIsActive);
  },
};
