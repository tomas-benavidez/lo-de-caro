import { expect, test, describe } from 'vitest';
import {
  calcularCostoFabricacionProducto,
  calcularUtilidad,
  calcularMargenGanancia,
  checkMargenBajo
} from '@/domain/producto';

describe('Producto de Venta domain logic', () => {
  test('calculates and rounds product manufacturing cost (costo fabricacion)', () => {
    // recipe cost = 200, yield = 8 portions (25 per portion)
    // base units = 1, packaging = 2 -> 25 * 1 + 2 = 27.00
    expect(calcularCostoFabricacionProducto(200, 8, 1, 2)).toBe(27);

    // recipe cost = 200, yield = 8 portions (25 per portion)
    // base units = 12 (docena), packaging = 10 -> 25 * 12 + 10 = 310.00
    expect(calcularCostoFabricacionProducto(200, 8, 12, 10)).toBe(310);

    // non-integer division: recipe cost = 100, yield = 3 (33.3333... per portion)
    // base units = 2, packaging = 1.50 -> 33.3333... * 2 + 1.50 = 68.1666... -> 68.17
    expect(calcularCostoFabricacionProducto(100, 3, 2, 1.50)).toBe(68.17);
  });

  test('calculates and rounds utility (utilidad)', () => {
    expect(calcularUtilidad(350, 310)).toBe(40);
    expect(calcularUtilidad(35.50, 27.15)).toBe(8.35);
  });

  test('calculates and rounds profit margin (margen ganancia) to 4 decimals', () => {
    expect(calcularMargenGanancia(400, 300)).toBe(0.2500);
    expect(calcularMargenGanancia(100, 85.50)).toBe(0.1450);
  });

  test('checks if profit margin is below target (margen bajo)', () => {
    expect(checkMargenBajo(0.1450, 0.20)).toBe(true);
    expect(checkMargenBajo(0.2500, 0.20)).toBe(false);
    expect(checkMargenBajo(0.2000, 0.20)).toBe(false); // boundary
  });
});
