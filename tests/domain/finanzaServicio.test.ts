import { describe, it, expect } from 'vitest';
import {
  formatearMesLegible,
  obtenerMesesDisponibles,
  filtrarVentasPorPeriodo,
  filtrarGastosPorPeriodo,
  calcularTopProductosVendidos,
  calcularDesgloseGastos,
  calcularTicketPromedio,
  calcularResumenFinancieroPeriodo,
} from '../../src/domain/services/finanzaServicio.ts';
import { Venta } from '../../src/domain/models/venta.ts';
import { Gasto } from '../../src/domain/models/gasto.ts';

describe('finanzaServicio', () => {
  describe('formatearMesLegible', () => {
    it('debe formatear YYYY-MM a NombreDelMes AAAA', () => {
      expect(formatearMesLegible('2026-10')).toBe('Octubre 2026');
      expect(formatearMesLegible('2026-01')).toBe('Enero 2026');
      expect(formatearMesLegible('2025-12')).toBe('Diciembre 2025');
    });

    it('debe retornar Histórico Completo para TODOS', () => {
      expect(formatearMesLegible('TODOS')).toBe('Histórico Completo');
    });

    it('debe manejar cadenas inválidas retornando la misma cadena', () => {
      expect(formatearMesLegible('invalido')).toBe('invalido');
    });
  });

  describe('obtenerMesesDisponibles', () => {
    it('debe extraer y deduplicar meses ordenados descendentemente', () => {
      const ventas: Partial<Venta>[] = [
        { fecha: '2026-08-15' },
        { fecha: '2026-10-01' },
      ];
      const gastos: Partial<Gasto>[] = [
        { fecha: '2026-09-10' },
        { fecha: '2026-10-20' },
      ];

      const meses = obtenerMesesDisponibles(
        ventas as Venta[],
        gastos as Gasto[],
        '2026-10'
      );

      expect(meses).toEqual(['2026-10', '2026-09', '2026-08']);
    });

    it('debe incluir siempre el mes actual aunque no haya registros', () => {
      const meses = obtenerMesesDisponibles([], [], '2026-11');
      expect(meses).toEqual(['2026-11']);
    });

    it('debe incorporar y ordenar meses adicionales configurados', () => {
      const meses = obtenerMesesDisponibles(
        [],
        [],
        '2026-10',
        ['2026-12', '2026-09']
      );
      expect(meses).toEqual(['2026-12', '2026-10', '2026-09']);
    });
  });

  describe('filtrarVentasPorPeriodo y filtrarGastosPorPeriodo', () => {
    const ventas: Partial<Venta>[] = [
      { id: '1', fecha: '2026-10-05', total: 1000 },
      { id: '2', fecha: '2026-09-12', total: 2000 },
      { id: '3', fecha: '2026-10-20', total: 3000 },
    ];
    const gastos: Partial<Gasto>[] = [
      { id: 'g1', fecha: '2026-10-02', monto: 500 },
      { id: 'g2', fecha: '2026-09-15', monto: 800 },
    ];

    it('debe retornar todos los elementos cuando el período es TODOS', () => {
      expect(filtrarVentasPorPeriodo(ventas as Venta[], 'TODOS')).toHaveLength(3);
      expect(filtrarGastosPorPeriodo(gastos as Gasto[], 'TODOS')).toHaveLength(2);
    });

    it('debe filtrar exclusivamente los elementos que coincidan con el mes', () => {
      const vOct = filtrarVentasPorPeriodo(ventas as Venta[], '2026-10');
      expect(vOct).toHaveLength(2);
      expect(vOct.map((v) => v.id)).toEqual(['1', '3']);

      const gSep = filtrarGastosPorPeriodo(gastos as Gasto[], '2026-09');
      expect(gSep).toHaveLength(1);
      expect(gSep[0].id).toBe('g2');
    });
  });

  describe('calcularTopProductosVendidos', () => {
    it('debe calcular unidades y facturación y ordenar por unidades vendidas desc', () => {
      const ventas: Partial<Venta>[] = [
        {
          id: 'v1',
          estadoPago: 'Cobrado',
          items: [
            {
              productoId: 'p1',
              nombreProducto: 'Milanesas de Pollo',
              cantidad: 3,
              precioUnitario: 5000,
              subtotal: 15000,
              unidadVenta: 'kg',
            },
            {
              productoId: 'p2',
              nombreProducto: 'Tartas Pascualina',
              cantidad: 2,
              precioUnitario: 4000,
              subtotal: 8000,
              unidadVenta: 'unid',
            },
          ],
        },
        {
          id: 'v2',
          estadoPago: 'Cobrado',
          items: [
            {
              productoId: 'p2',
              nombreProducto: 'Tartas Pascualina',
              cantidad: 5,
              precioUnitario: 4000,
              subtotal: 20000,
              unidadVenta: 'unid',
            },
          ],
        },
      ];

      const top = calcularTopProductosVendidos(ventas as Venta[]);
      expect(top).toHaveLength(2);
      // Pascualina total: 7 unidades, $28.000
      expect(top[0].productoId).toBe('p2');
      expect(top[0].unidadesVendidas).toBe(7);
      expect(top[0].facturacionTotal).toBe(28000);

      // Milanesas total: 3 unidades, $15.000
      expect(top[1].productoId).toBe('p1');
      expect(top[1].unidadesVendidas).toBe(3);
      expect(top[1].facturacionTotal).toBe(15000);
    });

    it('debe computar unidades pero no facturación cuando la venta es un Regalo', () => {
      const ventas: Partial<Venta>[] = [
        {
          id: 'v1',
          estadoPago: 'Regalo',
          total: 0,
          items: [
            {
              productoId: 'p1',
              nombreProducto: 'Raviolones',
              cantidad: 4,
              precioUnitario: 3000,
              subtotal: 12000,
              unidadVenta: 'porción',
            },
          ],
        },
      ];

      const top = calcularTopProductosVendidos(ventas as Venta[]);
      expect(top).toHaveLength(1);
      expect(top[0].unidadesVendidas).toBe(4);
      expect(top[0].facturacionTotal).toBe(0);
    });

    it('debe retornar lista vacía si no hay ventas o no hay ítems', () => {
      expect(calcularTopProductosVendidos([])).toEqual([]);
      expect(calcularTopProductosVendidos([{ items: [] } as unknown as Venta])).toEqual([]);
    });
  });

  describe('calcularDesgloseGastos', () => {
    it('debe agrupar por categoría y calcular porcentajes correctos', () => {
      const gastos: Partial<Gasto>[] = [
        { categoria: 'Materia Prima', monto: 60000 },
        { categoria: 'Packaging', monto: 20000 },
        { categoria: 'Servicios', monto: 20000 },
      ];

      const desglose = calcularDesgloseGastos(gastos as Gasto[]);
      expect(desglose).toHaveLength(3);
      expect(desglose[0]).toEqual({
        categoria: 'Materia Prima',
        monto: 60000,
        porcentaje: 60,
      });
      expect(desglose[1].monto).toBe(20000);
      expect(desglose[1].porcentaje).toBe(20);
    });

    it('debe retornar lista vacía si no hay gastos', () => {
      expect(calcularDesgloseGastos([])).toEqual([]);
    });
  });

  describe('calcularTicketPromedio', () => {
    it('debe calcular el promedio entre las ventas cobradas', () => {
      const ventas: Partial<Venta>[] = [
        { estadoPago: 'Cobrado', total: 10000 },
        { estadoPago: 'Cobrado', total: 20000 },
        { estadoPago: 'Pendiente', total: 15000 }, // no cobrada
        { estadoPago: 'Regalo', total: 0 },
      ];

      expect(calcularTicketPromedio(ventas as Venta[])).toBe(15000);
    });

    it('debe retornar 0 si no hay ventas cobradas', () => {
      expect(calcularTicketPromedio([])).toBe(0);
      expect(calcularTicketPromedio([{ estadoPago: 'Pendiente', total: 5000 }] as Venta[])).toBe(0);
    });
  });

  describe('calcularResumenFinancieroPeriodo', () => {
    it('debe calcular métricas consolidadas, margen, cumplimiento de meta y ticket promedio', () => {
      const ventas: Partial<Venta>[] = [
        {
          fecha: '2026-10-05',
          estadoPago: 'Cobrado',
          total: 200000,
          items: [
            {
              productoId: 'p1',
              nombreProducto: 'Hamburguesas',
              cantidad: 20,
              precioUnitario: 10000,
              subtotal: 200000,
              unidadVenta: 'unid',
            },
          ],
        },
        {
          fecha: '2026-10-15',
          estadoPago: 'Cobrado',
          total: 100000,
          items: [
            {
              productoId: 'p1',
              nombreProducto: 'Hamburguesas',
              cantidad: 10,
              precioUnitario: 10000,
              subtotal: 100000,
              unidadVenta: 'unid',
            },
          ],
        },
        // Venta de otro mes, no debe entrar en 2026-10
        {
          fecha: '2026-09-01',
          estadoPago: 'Cobrado',
          total: 500000,
          items: [],
        },
        // Venta pendiente en el período 2026-10
        {
          fecha: '2026-10-22',
          estadoPago: 'Pendiente',
          total: 80000,
          items: [],
        },
      ];

      const gastos: Partial<Gasto>[] = [
        { fecha: '2026-10-02', categoria: 'Materia Prima', monto: 120000 },
        { fecha: '2026-10-10', categoria: 'Packaging', monto: 30000 },
        { fecha: '2026-09-10', categoria: 'Servicios', monto: 10000 },
      ];

      const resumen = calcularResumenFinancieroPeriodo(
        ventas as Venta[],
        gastos as Gasto[],
        '2026-10',
        300000
      );

      expect(resumen.periodo).toBe('2026-10');
      expect(resumen.etiquetaPeriodo).toBe('Octubre 2026');
      expect(resumen.totalCobrado).toBe(300000);
      expect(resumen.totalPendiente).toBe(80000);
      expect(resumen.totalGastos).toBe(150000);
      expect(resumen.gananciaNeta).toBe(150000);
      expect(resumen.margenPorcentaje).toBe(50);
      expect(resumen.metaRetiro).toBe(300000);
      expect(resumen.porcentajeMeta).toBe(50); // 150.000 / 300.000 = 50%
      expect(resumen.faltaParaMeta).toBe(150000);
      expect(resumen.ticketPromedio).toBe(150000); // 300000 / 2 ventas cobradas
      expect(resumen.totalVentas).toBe(3); // 2 cobradas + 1 pendiente
      expect(resumen.topProductos).toHaveLength(1);
      expect(resumen.topProductos[0].unidadesVendidas).toBe(30);
      expect(resumen.desgloseGastos).toHaveLength(2);
    });

    it('debe manejar períodos con ganancia negativa y sin ventas', () => {
      const gastos: Partial<Gasto>[] = [
        { fecha: '2026-10-02', categoria: 'Servicios', monto: 50000 },
      ];

      const resumen = calcularResumenFinancieroPeriodo(
        [],
        gastos as Gasto[],
        '2026-10',
        300000
      );

      expect(resumen.totalCobrado).toBe(0);
      expect(resumen.totalPendiente).toBe(0);
      expect(resumen.totalGastos).toBe(50000);
      expect(resumen.gananciaNeta).toBe(-50000);
      expect(resumen.margenPorcentaje).toBe(0);
      expect(resumen.porcentajeMeta).toBe(0);
      expect(resumen.faltaParaMeta).toBe(350000);
      expect(resumen.ticketPromedio).toBe(0);
      expect(resumen.topProductos).toEqual([]);
    });
  });
});
