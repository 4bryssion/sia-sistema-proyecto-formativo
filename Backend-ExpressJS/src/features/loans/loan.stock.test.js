// Pruebas unitarias de las reglas de stock de préstamos (loan.stock.js) —
// Matriz de Casos de Prueba v6, módulo Préstamos. Casos: 001-PRE a 004-PRE.
// checkAvailability es una función pura; applyLend recibe la transacción como
// parámetro, así que se le pasa un objeto simulado.
import { checkAvailability, applyLend } from './loan.stock.js';

describe('Stock de préstamos', () => {
  test('001-PRE: un material serializado (placa SENA) solo puede prestarse de a 1 unidad', () => {
    const taladro = { id: 5, materialName: 'Taladro percutor', quantity: null, status: 'Disponible' };

    expect(checkAvailability(taladro, 2, 0)).toBe(
      'El material Taladro percutor es serializado (placa SENA): la cantidad debe ser 1.',
    );
  });

  test('002-PRE: rechaza una cantidad mayor al stock disponible de un material por cantidad', () => {
    const resma = { id: 1, materialName: 'Resma de papel carta', quantity: 35, status: 'Disponible' };

    expect(checkAvailability(resma, 40, 0)).toBe(
      'La cantidad solicitada (40) supera el stock disponible (35) de Resma de papel carta.',
    );
  });

  test('003-PRE: al editar un préstamo, las unidades que ya tiene prestadas cuentan como disponibles', () => {
    // Quedan 2 en bodega y el préstamo que se edita ya tiene 3: puede pasar a 5.
    const cable = { id: 2, materialName: 'Cable HDMI 2 m', quantity: 2, status: 'Disponible' };

    expect(checkAvailability(cable, 5, 3)).toBeNull();
  });

  test('004-PRE: prestar todas las unidades de un material por cantidad lo deja en cero y En_prestamo', async () => {
    const tx = { consumableMaterial: { update: jest.fn().mockResolvedValue({}) } };
    const marcadores = { id: 3, materialName: 'Marcadores borrables (caja x12)', quantity: 2, status: 'Disponible' };

    await applyLend(tx, marcadores, 2);

    expect(tx.consumableMaterial.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { quantity: 0, status: 'En_prestamo' },
    });
  });
});
