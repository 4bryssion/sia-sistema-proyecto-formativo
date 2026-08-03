import path from 'path';
import { notify } from '../notifications/notification.service.js';
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
  async getAll(status) {
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    return consumableMaterialRepository.findAll(filter);
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
      const created = await consumableMaterialRepository.create(data);
      // (P43) Log: creación de material (incluye cantidad inicial)
      notify({
        title: 'Material de consumo creado',
        description: `Se creó "${created.materialName}" con cantidad ${created.quantity ?? 1}${created.senaPlate ? ` (placa ${created.senaPlate})` : ''}.`,
        module: 'consumable-materials',
      });
      return created;
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
      // (P43) Log: modificación (detalla el cambio de cantidad si lo hubo)
      const cambioCantidad =
        data.quantity !== undefined && Number(data.quantity) !== Number(currentMaterial.quantity)
          ? ` Cantidad: ${currentMaterial.quantity ?? 1} → ${resultado.quantity ?? 1}.`
          : '';
      notify({
        title: cambioCantidad ? 'Cantidad de material modificada' : 'Material de consumo modificado',
        description: `Se actualizó "${resultado.materialName}".${cambioCantidad}`,
        module: 'consumable-materials',
      });
      return resultado;
    } catch (err) {
      if (file) deleteFile(data.image);
      throw err;
    }
  },

  async toggle(id) {
    const record = await consumableMaterialService.getById(id);
    const updated = await consumableMaterialRepository.toggle(id, !record.isActive);
    notify({
      title: updated.isActive ? 'Material de consumo activado' : 'Material de consumo desactivado',
      description: `"${updated.materialName}" quedó ${updated.isActive ? 'activo' : 'inactivo'}.`,
      severity: updated.isActive ? 'Informativa' : 'Advertencia',
      module: 'consumable-materials',
    });
    return updated;
  },
};
