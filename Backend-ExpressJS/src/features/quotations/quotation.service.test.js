// Pruebas unitarias del servicio de cotizaciones — Matriz de Casos de Prueba v6,
// módulo Cotizaciones. Casos: 001-COT, 002-COT y 003-COT.
import { parseQuotationIds, quotationService } from './quotation.service.js';
import { quotationRepository } from './quotation.repository.js';

jest.mock('./quotation.repository.js');

describe('Cotizaciones', () => {
  test('001-COT: parseQuotationIds convierte la lista JSON del formulario en números', () => {
    expect(parseQuotationIds('[1, "2", 3]')).toEqual([1, 2, 3]);
  });

  test('002-COT: parseQuotationIds rechaza identificadores que no son enteros positivos', () => {
    expect(() => parseQuotationIds('[1, -2]')).toThrow('La lista de cotizaciones contiene identificadores inválidos.');
  });

  test('003-COT: validarAsignacion rechaza más de 3 cotizaciones por material sin consultar la base', async () => {
    await expect(quotationService.validarAsignacion([1, 2, 3, 4])).rejects.toThrow('Un material admite máximo 3 cotizaciones.');
    expect(quotationRepository.contarHabilitadas).not.toHaveBeenCalled();
  });
});
