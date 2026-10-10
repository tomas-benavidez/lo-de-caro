import { describe, it, expect } from 'vitest';
import {
  clasificarStockCongelado,
  calcularConsumoIngredientes,
  calcularVariacionAjusteStock,
  validarDatosAjusteStock,
} from '../../src/domain/services/produccionServicio.ts';
import { RecetaIngredienteItem } from '../../src/domain/models/producto.ts';
import { MateriaPrima } from '../../src/domain/models/materiaPrima.ts';

describe('Servicio de Dominio: Producción y Stock de Congelados', () => {
  describe('clasificarStockCongelado', () => {
    it('debe clasificar como SIN_STOCK si el stock actual es 0 o negativo', () => {
      expect(clasificarStockCongelado(0, 5)).toBe('SIN_STOCK');
      expect(clasificarStockCongelado(-2, 5)).toBe('SIN_STOCK');
    });

    it('debe clasificar como REPONER si el stock actual es mayor a 0 pero menor o igual al stock mínimo', () => {
      expect(clasificarStockCongelado(5, 5)).toBe('REPONER');
      expect(clasificarStockCongelado(3, 5)).toBe('REPONER');
      expect(clasificarStockCongelado(1, 10)).toBe('REPONER');
    });

    it('debe clasificar como SALUDABLE si el stock actual supera el mínimo', () => {
      expect(clasificarStockCongelado(6, 5)).toBe('SALUDABLE');
      expect(clasificarStockCongelado(20, 5)).toBe('SALUDABLE');
    });
  });

  describe('calcularConsumoIngredientes', () => {
    const materiasPrimasEjemplo: MateriaPrima[] = [
      {
        id: 'mp-harina',
        nombre: 'Harina 0000',
        unidadMedida: 'kg',
        costoUnitario: 1200,
        stockActual: 10,
        stockMinimo: 2,
      },
      {
        id: 'mp-huevos',
        nombre: 'Huevos',
        unidadMedida: 'u',
        costoUnitario: 120,
        stockActual: 24,
        stockMinimo: 12,
      },
      {
        id: 'mp-ricotta',
        nombre: 'Ricotta',
        unidadMedida: 'kg',
        costoUnitario: 3500,
        stockActual: 1.5,
        stockMinimo: 1,
      },
    ];

    const recetaEjemplo: RecetaIngredienteItem[] = [
      {
        id: 'ri-1',
        materiaPrimaId: 'mp-harina',
        nombreMateriaPrima: 'Harina 0000',
        cantidad: 0.3, // 0.3 kg por porción
        unidadMedida: 'kg',
        costoUnitario: 1200,
      },
      {
        id: 'ri-2',
        materiaPrimaId: 'mp-huevos',
        nombreMateriaPrima: 'Huevos',
        cantidad: 2, // 2 huevos por porción
        unidadMedida: 'u',
        costoUnitario: 120,
      },
      {
        id: 'ri-3',
        materiaPrimaId: 'mp-ricotta',
        nombreMateriaPrima: 'Ricotta',
        cantidad: 0.2, // 0.2 kg por porción
        unidadMedida: 'kg',
        costoUnitario: 3500,
      },
    ];

    it('debe calcular correctamente el consumo total y remanente para una tanda de producción', () => {
      // Cocinar 5 porciones
      const resultado = calcularConsumoIngredientes(
        'prod-1',
        recetaEjemplo,
        5,
        materiasPrimasEjemplo
      );

      expect(resultado.productoId).toBe('prod-1');
      expect(resultado.cantidadElaborada).toBe(5);
      expect(resultado.hayStockInsuficiente).toBe(false);
      expect(resultado.ingredientes).toHaveLength(3);

      // Harina: 0.3 * 5 = 1.5 kg. Stock actual: 10 -> Remanente: 8.5 kg
      const harina = resultado.ingredientes.find((i) => i.materiaPrimaId === 'mp-harina');
      expect(harina).toBeDefined();
      expect(harina?.cantidadTotalConsumida).toBe(1.5);
      expect(harina?.stockRemanenteProyectado).toBe(8.5);
      expect(harina?.insuficiente).toBe(false);

      // Huevos: 2 * 5 = 10 u. Stock actual: 24 -> Remanente: 14 u
      const huevos = resultado.ingredientes.find((i) => i.materiaPrimaId === 'mp-huevos');
      expect(huevos?.cantidadTotalConsumida).toBe(10);
      expect(huevos?.stockRemanenteProyectado).toBe(14);
      expect(huevos?.insuficiente).toBe(false);

      // Ricotta: 0.2 * 5 = 1.0 kg. Stock actual: 1.5 -> Remanente: 0.5 kg
      const ricotta = resultado.ingredientes.find((i) => i.materiaPrimaId === 'mp-ricotta');
      expect(ricotta?.cantidadTotalConsumida).toBe(1.0);
      expect(ricotta?.stockRemanenteProyectado).toBe(0.5);
      expect(ricotta?.insuficiente).toBe(false);
    });

    it('debe alertar hayStockInsuficiente si la cantidad a consumir supera el stock disponible', () => {
      // Cocinar 10 porciones: Ricotta necesaria = 0.2 * 10 = 2 kg (pero hay 1.5 kg)
      const resultado = calcularConsumoIngredientes(
        'prod-1',
        recetaEjemplo,
        10,
        materiasPrimasEjemplo
      );

      expect(resultado.hayStockInsuficiente).toBe(true);

      const ricotta = resultado.ingredientes.find((i) => i.materiaPrimaId === 'mp-ricotta');
      expect(ricotta?.cantidadTotalConsumida).toBe(2);
      expect(ricotta?.stockActualDisponible).toBe(1.5);
      expect(ricotta?.stockRemanenteProyectado).toBe(-0.5);
      expect(ricotta?.insuficiente).toBe(true);

      // Los otros insumos suficientes
      const harina = resultado.ingredientes.find((i) => i.materiaPrimaId === 'mp-harina');
      expect(harina?.insuficiente).toBe(false);
    });

    it('debe manejar recetas vacías retornando lista vacía y stock suficiente', () => {
      const resultado = calcularConsumoIngredientes(
        'prod-vacio',
        [],
        10,
        materiasPrimasEjemplo
      );

      expect(resultado.ingredientes).toEqual([]);
      expect(resultado.hayStockInsuficiente).toBe(false);
    });

    it('debe manejar cantidades elaboradas 0 o negativas sin consumos negativos', () => {
      const resultado = calcularConsumoIngredientes(
        'prod-1',
        recetaEjemplo,
        0,
        materiasPrimasEjemplo
      );

      expect(resultado.cantidadElaborada).toBe(0);
      expect(resultado.hayStockInsuficiente).toBe(false);
      expect(resultado.ingredientes[0].cantidadTotalConsumida).toBe(0);
    });
  });

  describe('calcularVariacionAjusteStock', () => {
    it('debe calcular variaciones positivas para aumentos de stock', () => {
      expect(calcularVariacionAjusteStock(10, 15)).toBe(5);
      expect(calcularVariacionAjusteStock(0, 8.5)).toBe(8.5);
    });

    it('debe calcular variaciones negativas para retiros de stock', () => {
      expect(calcularVariacionAjusteStock(20, 15)).toBe(-5);
      expect(calcularVariacionAjusteStock(10, 0)).toBe(-10);
    });

    it('debe retornar 0 si no hay cambios', () => {
      expect(calcularVariacionAjusteStock(12, 12)).toBe(0);
    });
  });

  describe('validarDatosAjusteStock', () => {
    it('debe validar exitosamente números válidos y redondear a 3 decimales', () => {
      const res = validarDatosAjusteStock(12.3456, 'Consumo personal');
      expect(res.valido).toBe(true);
      expect(res.nuevoStockNormalizado).toBe(12.346);
    });

    it('debe aceptar 0 como stock válido', () => {
      const res = validarDatosAjusteStock(0, 'Merma / Rotura');
      expect(res.valido).toBe(true);
      expect(res.nuevoStockNormalizado).toBe(0);
    });

    it('debe rechazar null, undefined, booleanos y strings vacíos', () => {
      expect(validarDatosAjusteStock(null).valido).toBe(false);
      expect(validarDatosAjusteStock(undefined).valido).toBe(false);
      expect(validarDatosAjusteStock(false).valido).toBe(false);
      expect(validarDatosAjusteStock(true).valido).toBe(false);
      expect(validarDatosAjusteStock('').valido).toBe(false);
      expect(validarDatosAjusteStock('   ').valido).toBe(false);
    });

    it('debe rechazar números negativos', () => {
      const res = validarDatosAjusteStock(-1, 'Consumo personal');
      expect(res.valido).toBe(false);
      expect(res.error).toBe('El stock físico no puede ser negativo.');
    });

    it('debe rechazar valores no finitos (NaN, Infinity)', () => {
      expect(validarDatosAjusteStock(NaN).valido).toBe(false);
      expect(validarDatosAjusteStock(Infinity).valido).toBe(false);
      expect(validarDatosAjusteStock(-Infinity).valido).toBe(false);
    });

    it('debe rechazar motivos no autorizados', () => {
      const res = validarDatosAjusteStock(5, 'Robo no registrado' as any);
      expect(res.valido).toBe(false);
      expect(res.error).toBe('Debe especificar un motivo válido de ajuste.');
    });
  });
});
