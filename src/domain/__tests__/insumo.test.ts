import { expect, test, describe } from 'vitest';
import { calcularCostoBrutoUnitario } from '@/domain/insumo';

describe('Insumo domain logic', () => {
  test('calculates and rounds unit cost to 4 decimal places', () => {
    // 100 paid for 3 units = 33.333333... should round to 33.3333
    expect(calcularCostoBrutoUnitario(100, 3)).toBe(33.3333);

    // 150.75 paid for 12.5 units = 12.06
    expect(calcularCostoBrutoUnitario(150.75, 12.5)).toBe(12.06);

    // 10.0005 paid for 1 unit = 10.0005
    expect(calcularCostoBrutoUnitario(10.0005, 1)).toBe(10.0005);
  });
});
