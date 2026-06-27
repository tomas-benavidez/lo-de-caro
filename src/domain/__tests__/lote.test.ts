import { expect, test, describe } from 'vitest';
import { sugerirConsumoBruto, actualizarStockInsumo } from '@/domain/lote';

describe('Lote de Produccion domain logic', () => {
  test('suggests gross material consumption (consumo bruto sugerido)', () => {
    // 80g net weight, 20% waste -> 100g gross weight per recipe.
    // yield = 8, produced = 16 (multiplier = 2) -> 100g * 2 = 200g
    expect(sugerirConsumoBruto(80, 20, 16, 8)).toBe(200);

    // 100g net weight, 15% waste -> 117.65g gross weight per recipe (rounded).
    // yield = 8, produced = 12 (multiplier = 1.5) -> 117.65 * 1.5 = 176.475 -> 176.48g
    expect(sugerirConsumoBruto(100, 15, 12, 8)).toBe(176.48);
  });

  test('updates inventory stock (actualizar stock)', () => {
    expect(actualizarStockInsumo(1000, 200)).toBe(800.00);
    expect(actualizarStockInsumo(500.25, 176.48)).toBe(323.77);
    expect(actualizarStockInsumo(50, 60)).toBe(-10.00); // negative stock allowed in domain
  });
});
