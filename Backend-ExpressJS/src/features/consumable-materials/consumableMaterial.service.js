import path from 'path';
import fs from 'fs';
import { consumableMaterialRepository } from './consumableMaterial.repository.js';

const deleteFile = (filePath) => {
  if (filePath) {
    const rutaCompleta = path.join('uploads', path.basename(filePath));
    fs.unlink(rutaCompleta, (err) => {
      if (err) console.error('Error eliminando imagen:', err);
    });
  }
};

const parseNumericos = (data) => ({
  ...data,
  userId: data.userId ? Number(data.userId) : undefined,
  brandId: data.brandId ? Number(data.brandId) : undefined,
  quantity: data.quantity !== undefined ? Number(data.quantity) : undefined,
  unitPrice: data.unitPrice ? Number(data.unitPrice) : undefined,
  totalPrice: data.totalPrice ? Number(data.totalPrice) : undefined,
  purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString() : undefined,
});

export const consumableMaterialService = {
  async getAll() {
    return consumableMaterialRepository.findAll();
  },

  async getById(id) {
    const material = await consumableMaterialRepository.findById(id);
    if (!material) throw new Error('Material de consumo no encontrado.');
    if (material.returnable) throw new Error('Este material es devolutivo. Usa /returnable-materials.');
    return material;
  },

  async create(bodyData, file) {
    if (!file) throw new Error('La imagen es requerida.');

    const data = parseNumericos(bodyData);
    data.image = `/uploads/${file.filename}`;

    try {
      return await consumableMaterialRepository.create(data);
    } catch (err) {
      deleteFile(data.image);
      throw err;
    }
  },

  async update(id, bodyData, file) {
    const currentMaterial = await consumableMaterialService.getById(id);

    const data = parseNumericos(bodyData);
    if (file) data.image = `/uploads/${file.filename}`;

    try {
      const resultado = await consumableMaterialRepository.update(id, data);
      if (file && currentMaterial.image) deleteFile(currentMaterial.image);
      return resultado;
    } catch (err) {
      if (file) deleteFile(data.image);
      throw err;
    }
  },

  async toggle(id) {
    const record = await consumableMaterialService.getById(id);
    return consumableMaterialRepository.toggle(id, !record.isActive);
  },
};
