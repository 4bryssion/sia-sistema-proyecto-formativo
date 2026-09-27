// Prueba unitaria de consumableMaterialService.create — Matriz de Casos de Prueba v6,
// módulo Materiales de Consumo. Caso: 003-MCON.
// Se simulan el repository, el borrado de archivos y el servicio de cotizaciones:
// no se toca la base de datos ni el disco.
import { consumableMaterialService } from './consumableMaterial.service.js';
import { consumableMaterialRepository } from './consumableMaterial.repository.js';
import { deleteFiles } from '../../shared/orderedFiles.js';

jest.mock('./consumableMaterial.repository.js');
jest.mock('../../shared/orderedFiles.js');
jest.mock('../quotations/quotation.service.js');

describe('consumableMaterialService.create', () => {
  test('003-MCON: sin imagen rechaza la creación y borra del disco la ficha técnica ya subida', async () => {
    const files = {
      technical_sheet: [{ filename: 'ficha-1700000000.pdf', originalname: 'ficha-tecnica.pdf', mimetype: 'application/pdf' }],
    };

    await expect(consumableMaterialService.create({ materialName: 'Resma' }, files)).rejects.toThrow('La imagen es requerida.');

    expect(deleteFiles).toHaveBeenCalledWith(['/uploads/ficha-1700000000.pdf']);
    expect(consumableMaterialRepository.create).not.toHaveBeenCalled();
  });
});
