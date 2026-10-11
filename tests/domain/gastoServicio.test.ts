import { describe, it, expect } from 'vitest';
import {
  calcularResumenGastos,
  calcularNuevoCostoUnitario,
  filtrarGastos,
  validarNuevoGasto,
} from '../../src/domain/services/gastoServicio.ts';
import { Gasto, NuevoGastoInput } from '../../src/domain/models/gasto.ts';

describe('Servicio de Dominio: GastoServicio', () => {
  describe('calcularResumenGastos', () => {
    it('retorna ceros cuando la lista de gastos está vacía', () => {
      const resumen = calcularResumenGastos([]);
      expect(resumen).toEqual({
        totalGastos: 0,
        totalMateriaPrima: 0,
        totalOperativos: 0,
        totalEfectivo: 0,
        totalTransferencia: 0,
        cantidadGastos: 0,
      });
    });

    it('calcula sumas totales, por categoría y por método de pago correctamente', () => {
      const gastos: Gasto[] = [
        {
          id: 'g-1',
          fecha: '2026-10-10',
          concepto: 'Compra 25kg Harina 0000',
          categoria: 'Materia Prima',
          monto: 25000,
          metodoPago: 'Efectivo',
        },
        {
          id: 'g-2',
          fecha: '2026-10-10',
          concepto: 'Garrafa 10kg de gas',
          categoria: 'Servicios',
          monto: 15000,
          metodoPago: 'Transferencia',
        },
        {
          id: 'g-3',
          fecha: '2026-10-11',
          concepto: '500 Cajas de pastas',
          categoria: 'Packaging',
          monto: 35000,
          metodoPago: 'Transferencia',
        },
        {
          id: 'g-4',
          fecha: '2026-10-11',
          concepto: 'Cuchillas y espátula',
          categoria: 'Equipamiento',
          monto: 8500,
          metodoPago: 'Efectivo',
        },
        {
          id: 'g-5',
          fecha: '2026-10-11',
          concepto: 'Lavandina y bolsas de consorcio',
          categoria: 'Otros',
          monto: 4500,
          metodoPago: 'Efectivo',
        },
      ];

      const resumen = calcularResumenGastos(gastos);

      expect(resumen.totalGastos).toBe(88000); // 25000 + 15000 + 35000 + 8500 + 4500
      expect(resumen.totalMateriaPrima).toBe(25000);
      expect(resumen.totalOperativos).toBe(63000); // 15000 + 35000 + 8500 + 4500
      expect(resumen.totalEfectivo).toBe(38000); // 25000 + 8500 + 4500
      expect(resumen.totalTransferencia).toBe(50000); // 15000 + 35000
      expect(resumen.cantidadGastos).toBe(5);
    });

    it('redondea los montos a 2 decimales', () => {
      const gastos: Gasto[] = [
        {
          id: 'g-1',
          fecha: '2026-10-10',
          concepto: 'Insumo fraccionado',
          categoria: 'Materia Prima',
          monto: 1234.567,
          metodoPago: 'Efectivo',
        },
        {
          id: 'g-2',
          fecha: '2026-10-10',
          concepto: 'Servicio con centavos',
          categoria: 'Servicios',
          monto: 2345.678,
          metodoPago: 'Transferencia',
        },
      ];

      const resumen = calcularResumenGastos(gastos);
      expect(resumen.totalGastos).toBe(3580.25);
    });
  });

  describe('calcularNuevoCostoUnitario', () => {
    it('calcula el costo unitario dividiendo monto por cantidad comprada', () => {
      const costo = calcularNuevoCostoUnitario(25000, 25);
      expect(costo).toBe(1000);
    });

    it('calcula con precisión de hasta 4 decimales', () => {
      // Ej: $15.500 por 3.500 gramos = 4.42857... -> 4.4286
      const costo = calcularNuevoCostoUnitario(15500, 3500);
      expect(costo).toBe(4.4286);
    });

    it('retorna 0 si la cantidad es 0 o negativa', () => {
      expect(calcularNuevoCostoUnitario(5000, 0)).toBe(0);
      expect(calcularNuevoCostoUnitario(5000, -10)).toBe(0);
    });

    it('retorna 0 si el monto es 0 o negativo', () => {
      expect(calcularNuevoCostoUnitario(0, 10)).toBe(0);
      expect(calcularNuevoCostoUnitario(-500, 10)).toBe(0);
    });
  });

  describe('filtrarGastos', () => {
    const gastos: Gasto[] = [
      {
        id: 'g-1',
        fecha: '2026-10-10',
        concepto: 'Compra Harina Molino Cañuelas',
        categoria: 'Materia Prima',
        monto: 25000,
        metodoPago: 'Efectivo',
      },
      {
        id: 'g-2',
        fecha: '2026-10-10',
        concepto: 'Garrafa Gas',
        categoria: 'Servicios',
        monto: 15000,
        metodoPago: 'Transferencia',
      },
      {
        id: 'g-3',
        fecha: '2026-10-11',
        concepto: 'Cajas Ravioles',
        categoria: 'Packaging',
        monto: 35000,
        metodoPago: 'Transferencia',
      },
    ];

    it('retorna todos los gastos cuando categoria es "Todas" y metodo es "Todos" sin busqueda', () => {
      const resultado = filtrarGastos(gastos, 'Todas', 'Todos', '');
      expect(resultado).toHaveLength(3);
    });

    it('filtra por categoria específica', () => {
      const resultado = filtrarGastos(gastos, 'Materia Prima');
      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('g-1');
    });

    it('filtra por metodo de pago específico', () => {
      const resultado = filtrarGastos(gastos, 'Todas', 'Transferencia');
      expect(resultado).toHaveLength(2);
      expect(resultado.map((g) => g.id)).toEqual(['g-2', 'g-3']);
    });

    it('filtra por termino de busqueda en el concepto insensible a mayúsculas', () => {
      const resultado = filtrarGastos(gastos, 'Todas', 'Todos', 'molino');
      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('g-1');
    });

    it('combina categoría, método de pago y texto', () => {
      const resultado = filtrarGastos(gastos, 'Packaging', 'Transferencia', 'cajas');
      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('g-3');
    });
  });

  describe('validarNuevoGasto', () => {
    it('valida exitosamente un gasto operativo válido', () => {
      const input: NuevoGastoInput = {
        concepto: 'Factura de Luz Edenor',
        categoria: 'Servicios',
        monto: 22000,
        metodoPago: 'Transferencia',
        fecha: '2026-10-11',
      };
      const resultado = validarNuevoGasto(input);
      expect(resultado.valido).toBe(true);
      expect(resultado.error).toBeUndefined();
    });

    it('rechaza cuando el concepto está vacío o solo espacios', () => {
      const input: NuevoGastoInput = {
        concepto: '   ',
        categoria: 'Servicios',
        monto: 22000,
        metodoPago: 'Transferencia',
      };
      const resultado = validarNuevoGasto(input);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('concepto');
    });

    it('rechaza cuando el monto es 0 o negativo', () => {
      const input: NuevoGastoInput = {
        concepto: 'Bolsas',
        categoria: 'Packaging',
        monto: 0,
        metodoPago: 'Efectivo',
      };
      const resultado = validarNuevoGasto(input);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('monto');
    });

    it('rechaza cuando compraMateriaPrima tiene cantidad <= 0', () => {
      const input: NuevoGastoInput = {
        concepto: 'Harina',
        categoria: 'Materia Prima',
        monto: 10000,
        metodoPago: 'Efectivo',
        compraMateriaPrima: {
          materiaPrimaId: 'mp-1',
          cantidadComprada: 0,
          actualizarCostoUnitario: true,
        },
      };
      const resultado = validarNuevoGasto(input);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('cantidad');
    });

    it('rechaza cuando compraMateriaPrima no especifica materiaPrimaId', () => {
      const input: NuevoGastoInput = {
        concepto: 'Harina',
        categoria: 'Materia Prima',
        monto: 10000,
        metodoPago: 'Efectivo',
        compraMateriaPrima: {
          materiaPrimaId: '',
          cantidadComprada: 10,
          actualizarCostoUnitario: true,
        },
      };
      const resultado = validarNuevoGasto(input);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('materia prima');
    });

    it('rechaza cuando la categoría no es válida', () => {
      const input = {
        concepto: 'Alquiler local',
        categoria: 'Invalida' as any,
        monto: 50000,
        metodoPago: 'Transferencia' as const,
      };
      const resultado = validarNuevoGasto(input);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('categoría');
    });

    it('rechaza cuando el método de pago no es válido', () => {
      const input = {
        concepto: 'Artículos de limpieza',
        categoria: 'Otros' as const,
        monto: 5000,
        metodoPago: 'Cripto' as any,
      };
      const resultado = validarNuevoGasto(input);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('método de pago');
    });
  });
});
