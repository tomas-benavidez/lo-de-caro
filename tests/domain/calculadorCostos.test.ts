import { describe, it, expect } from 'vitest';
import {
  calcularCostoReceta,
  calcularMargenGanancia,
  evaluarEstadoStock,
  clasificarMargen,
} from '../../src/domain/services/calculadorCostos.ts';
import { RecetaIngredienteItem } from '../../src/domain/models/producto.ts';

describe('Servicio de Dominio: Calculador de Costos y Márgenes', () => {
  it('debe calcular correctamente el costo de una receta sumando sus ingredientes', () => {
    const ingredientesTarta: RecetaIngredienteItem[] = [
      {
        materiaPrimaId: '1',
        nombreMateriaPrima: 'Tapa de Tarta',
        cantidad: 1,
        unidadMedida: 'u',
        costoUnitario: 800,
      },
      {
        materiaPrimaId: '2',
        nombreMateriaPrima: 'Atún en lata',
        cantidad: 2,
        unidadMedida: 'u',
        costoUnitario: 1500,
      },
      {
        materiaPrimaId: '3',
        nombreMateriaPrima: 'Cebolla salteada',
        cantidad: 200,
        unidadMedida: 'g',
        costoUnitario: 2.5, // $2.5 por gramo
      },
    ];

    const costoTotal = calcularCostoReceta(ingredientesTarta);
    // 800 + (2 * 1500) + (200 * 2.5) = 800 + 3000 + 500 = 4300
    expect(costoTotal).toBe(4300);
  });

  it('debe retornar 0 si la receta no tiene ingredientes', () => {
    expect(calcularCostoReceta([])).toBe(0);
  });

  it('debe calcular el margen de ganancia en pesos y porcentaje correctamente', () => {
    const precioLista = 12000;
    const costoProduccion = 4300;

    const { margenPesos, margenPorcentaje } = calcularMargenGanancia(
      precioLista,
      costoProduccion
    );

    expect(margenPesos).toBe(7700);
    // (7700 / 12000) * 100 = 64.1666... -> 64.2%
    expect(margenPorcentaje).toBe(64.2);
  });

  it('debe indicar REPONER cuando el stock actual es menor o igual al mínimo', () => {
    expect(evaluarEstadoStock(5, 5)).toBe('REPONER');
    expect(evaluarEstadoStock(3, 5)).toBe('REPONER');
    expect(evaluarEstadoStock(6, 5)).toBe('OK');
  });

  it('debe calcular costo correctamente con unidades kg y l', () => {
    const ingredientes: RecetaIngredienteItem[] = [
      {
        materiaPrimaId: 'm1',
        nombreMateriaPrima: 'Harina 0000',
        cantidad: 0.5, // 0.5 kg
        unidadMedida: 'kg',
        costoUnitario: 1200, // $1200 por kg
      },
      {
        materiaPrimaId: 'm2',
        nombreMateriaPrima: 'Leche entera',
        cantidad: 0.25, // 0.25 l
        unidadMedida: 'l',
        costoUnitario: 1000, // $1000 por litro
      },
    ];

    const costo = calcularCostoReceta(ingredientes);
    // (0.5 * 1200) + (0.25 * 1000) = 600 + 250 = 850
    expect(costo).toBe(850);
  });

  it('debe clasificar los márgenes en SALUDABLE, ADVERTENCIA o PERDIDA', () => {
    // Margen >= 30% -> SALUDABLE
    expect(clasificarMargen(50, 2500)).toBe('SALUDABLE');
    expect(clasificarMargen(30, 1500)).toBe('SALUDABLE');

    // Margen entre 0% y 29.9% -> ADVERTENCIA
    expect(clasificarMargen(25, 1000)).toBe('ADVERTENCIA');
    expect(clasificarMargen(5, 200)).toBe('ADVERTENCIA');

    // Margen negativo -> PERDIDA
    expect(clasificarMargen(-10, -500)).toBe('PERDIDA');
    expect(clasificarMargen(0, -100)).toBe('PERDIDA');

    // Estado NEUTRO cuando no hay precio ni costo cargado
    expect(clasificarMargen(0, 0, 0, 0)).toBe('NEUTRO');
    expect(clasificarMargen(0, 0)).toBe('NEUTRO');

    // Estado SIN_RECETA cuando hay precio de venta pero no hay ingredientes costeaados
    expect(clasificarMargen(100, 9000, 0, 9000)).toBe('SIN_RECETA');

    // Costo sin precio de venta -> PERDIDA
    expect(clasificarMargen(0, -1200, 1200, 0)).toBe('PERDIDA');
  });

  it('debe redondear el costo a 2 decimales ante números con muchos decimales', () => {
    const ingredientes: RecetaIngredienteItem[] = [
      {
        materiaPrimaId: 'm1',
        nombreMateriaPrima: 'Especias',
        cantidad: 0.3333,
        unidadMedida: 'g',
        costoUnitario: 12.3456,
      },
    ];

    const costo = calcularCostoReceta(ingredientes);
    // 0.3333 * 12.3456 = 4.11478848 -> 4.11
    expect(costo).toBe(4.11);
  });

  it('debe calcular margen de ganancia cuando el precio de venta es 0 pero hay costo', () => {
    const { margenPesos, margenPorcentaje } = calcularMargenGanancia(0, 1500);
    expect(margenPesos).toBe(-1500);
    expect(margenPorcentaje).toBe(0);
  });
});

