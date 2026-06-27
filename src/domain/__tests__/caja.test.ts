import { expect, test, describe } from 'vitest';
import { calcularGananciaNeta } from '@/domain/caja';

describe('Caja y Balance Financiero domain logic', () => {
  test('calculates net profit excluding capital investments', () => {
    // 10000 sales, 4500 manufacturing cost, 2500 investments.
    // Excluding investments: 10000 - 4500 = 5500.00
    expect(calcularGananciaNeta(10000, 4500, 2500, true)).toBe(5500.00);
    expect(calcularGananciaNeta(10000.75, 4500.30, 2500.10, true)).toBe(5500.45);
  });

  test('calculates net profit including capital investments', () => {
    // Including investments: 10000 - 4500 - 2500 = 3000.00
    expect(calcularGananciaNeta(10000, 4500, 2500, false)).toBe(3000.00);
    expect(calcularGananciaNeta(10000.75, 4500.30, 2500.10, false)).toBe(3000.35);
  });
});
