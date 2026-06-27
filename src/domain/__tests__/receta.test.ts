import { expect, test, describe } from 'vitest';
import {
  calcularPesoBrutoRequerido,
  calcularCostoIngrediente,
  calcularCostoTotalReceta,
  Receta,
  IngredienteReceta
} from '@/domain/receta';

describe('Receta domain logic', () => {
  test('calculates and rounds gross weight required (peso bruto)', () => {
    // 80g net weight, 20% waste -> 80 / (1 - 0.20) = 100g
    expect(calcularPesoBrutoRequerido(80, 20)).toBe(100);

    // 100g net weight, 15% waste -> 100 / (1 - 0.15) = 117.647... -> 117.65g
    expect(calcularPesoBrutoRequerido(100, 15)).toBe(117.65);

    // 50g net weight, 0% waste -> 50 / (1 - 0) = 50g
    expect(calcularPesoBrutoRequerido(50, 0)).toBe(50);
  });

  test('calculates and rounds ingredient cost (money to 2 decimals)', () => {
    // peso bruto = 100. Unit cost = 0.5 -> 100 * 0.5 = 50.00
    expect(calcularCostoIngrediente(80, 20, 0.5)).toBe(50);

    // peso bruto = 117.65. Unit cost = 1.25 -> 117.65 * 1.25 = 147.0625 -> 147.06
    expect(calcularCostoIngrediente(100, 15, 1.25)).toBe(147.06);
  });

  test('calculates and rounds total recipe cost', () => {
    const receta: Receta = {
      id: 'receta-1',
      nombre: 'Tarta de Manzana',
      porciones_rendimiento: 8,
      costo_envase: 5.50,
      created_at: new Date()
    };

    const ingredientes = [
      {
        ingrediente: {
          id: 'i1',
          receta_id: 'receta-1',
          insumo_id: 'insumo-1',
          peso_limpio: 80,
          porcentaje_merma: 20
        },
        costoBrutoUnitario: 0.50
      },
      {
        ingrediente: {
          id: 'i2',
          receta_id: 'receta-1',
          insumo_id: 'insumo-2',
          peso_limpio: 100,
          porcentaje_merma: 15
        },
        costoBrutoUnitario: 1.25
      }
    ];

    // Ingrediente 1 cost: 50.00
    // Ingrediente 2 cost: 147.06
    // Packaging cost: 5.50
    // Total: 50.00 + 147.06 + 5.50 = 202.56
    expect(calcularCostoTotalReceta(receta, ingredientes)).toBe(202.56);
  });
});
