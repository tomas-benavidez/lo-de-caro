import { expect, test, describe } from 'vitest';
import { Inversion, calcularDepreciacionMensual } from '@/domain/inversion';
import {
  calcularCostosFijosTotalesMensuales,
  calcularCostoFijoProrrateadoPorUnidad
} from '@/domain/costos_fijos';

describe('Costos e Inversiones domain logic', () => {
  test('calculates and rounds monthly depreciation (depreciacion mensual)', () => {
    const inversionA: Inversion = {
      id: 'inv-1',
      nombre: 'Horno Industrial',
      monto: 12000,
      vida_util_anios: 5,
      fecha_compra: new Date(),
      created_at: new Date()
    };

    const inversionB: Inversion = {
      id: 'inv-2',
      nombre: 'Batidora Planetaria',
      monto: 5000,
      vida_util_anios: 3,
      fecha_compra: new Date(),
      created_at: new Date()
    };

    expect(calcularDepreciacionMensual(inversionA)).toBe(200.00);
    expect(calcularDepreciacionMensual(inversionB)).toBe(138.89); // 5000 / 36 = 138.888...
  });

  test('calculates and rounds total fixed monthly costs', () => {
    const fixedCosts = [1500.00, 800.50];
    const depreciations = [200.00, 138.89];

    // 1500.00 + 800.50 + 200.00 + 138.89 = 2639.39
    expect(calcularCostosFijosTotalesMensuales(fixedCosts, depreciations)).toBe(2639.39);
  });

  test('calculates and rounds prorated fixed cost per unit', () => {
    // 2639.39 monthly costs, 500 units estimated production -> 2639.39 / 500 = 5.27878 -> 5.28
    expect(calcularCostoFijoProrrateadoPorUnidad(2639.39, 500)).toBe(5.28);
  });
});
