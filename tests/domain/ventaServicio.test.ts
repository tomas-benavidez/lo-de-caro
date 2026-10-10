import { describe, it, expect } from 'vitest';
import {
  calcularSubtotalItem,
  calcularTotalVenta,
  verificarDisponibilidadStock,
  calcularResumenFinanciero,
  validarDatosNuevaVenta,
} from '../../src/domain/services/ventaServicio.ts';
import { Producto } from '../../src/domain/models/producto.ts';
import { Venta } from '../../src/domain/models/venta.ts';
import { Cliente } from '../../src/domain/models/cliente.ts';

describe('Servicio de Dominio: Ventas y Cobranzas', () => {
  describe('calcularSubtotalItem', () => {
    it('calcula el subtotal redondeado a 2 decimales', () => {
      expect(calcularSubtotalItem(2, 4500)).toBe(9000);
      expect(calcularSubtotalItem(1.5, 3333.333)).toBe(5000);
    });

    it('retorna 0 si cantidad o precio son cero o negativos', () => {
      expect(calcularSubtotalItem(0, 5000)).toBe(0);
      expect(calcularSubtotalItem(-1, 5000)).toBe(0);
      expect(calcularSubtotalItem(2, -100)).toBe(0);
    });
  });

  describe('calcularTotalVenta', () => {
    it('suma los subtotales de los items cuando es Cobrado o Pendiente', () => {
      const items = [
        { cantidad: 2, precioUnitario: 3500 },
        { cantidad: 1, precioUnitario: 4000 },
      ];
      expect(calcularTotalVenta(items, 'Cobrado')).toBe(11000);
      expect(calcularTotalVenta(items, 'Pendiente')).toBe(11000);
    });

    it('retorna 0 si el estado es Regalo', () => {
      const items = [
        { cantidad: 2, precioUnitario: 3500 },
      ];
      expect(calcularTotalVenta(items, 'Regalo')).toBe(0);
    });

    it('retorna 0 si no hay items', () => {
      expect(calcularTotalVenta([], 'Cobrado')).toBe(0);
    });
  });

  describe('verificarDisponibilidadStock', () => {
    const productos: Producto[] = [
      {
        id: 'prod-1',
        nombre: 'Raviolones',
        categoria: 'Pastas Rellenas',
        unidadVenta: 'Porcion',
        precioLista: 4500,
        stockActual: 10,
        stockMinimo: 3,
        ingredientes: [],
        activo: true,
      },
      {
        id: 'prod-2',
        nombre: 'Empanadas de Carne',
        categoria: 'Empanadas',
        unidadVenta: 'Docena',
        precioLista: 8000,
        stockActual: 2,
        stockMinimo: 5,
        ingredientes: [],
        activo: true,
      },
    ];

    it('indica suficiente cuando hay stock suficiente en freezer', () => {
      const items = [{ productoId: 'prod-1', cantidad: 4 }];
      const res = verificarDisponibilidadStock(items, productos);
      expect(res).toHaveLength(1);
      expect(res[0].suficiente).toBe(true);
      expect(res[0].stockActual).toBe(10);
      expect(res[0].remanente).toBe(6);
    });

    it('indica insuficiente cuando la cantidad solicitada supera el stock', () => {
      const items = [{ productoId: 'prod-2', cantidad: 5 }];
      const res = verificarDisponibilidadStock(items, productos);
      expect(res).toHaveLength(1);
      expect(res[0].suficiente).toBe(false);
      expect(res[0].stockActual).toBe(2);
      expect(res[0].remanente).toBe(-3);
    });

    it('maneja productos no encontrados con stock cero', () => {
      const items = [{ productoId: 'no-existe', cantidad: 1 }];
      const res = verificarDisponibilidadStock(items, productos);
      expect(res).toHaveLength(1);
      expect(res[0].suficiente).toBe(false);
      expect(res[0].stockActual).toBe(0);
      expect(res[0].remanente).toBe(-1);
    });
  });

  describe('calcularResumenFinanciero', () => {
    const ventas: Venta[] = [
      {
        id: 'v-1',
        fecha: '2026-10-10',
        total: 10000,
        estadoPago: 'Cobrado',
        metodoPago: 'Efectivo',
        items: [],
      },
      {
        id: 'v-2',
        fecha: '2026-10-10',
        total: 5000,
        estadoPago: 'Cobrado',
        metodoPago: 'Transferencia',
        items: [],
      },
      {
        id: 'v-3',
        fecha: '2026-10-10',
        total: 8000,
        estadoPago: 'Pendiente',
        metodoPago: 'Efectivo',
        items: [],
      },
      {
        id: 'v-4',
        fecha: '2026-10-10',
        total: 0,
        estadoPago: 'Regalo',
        metodoPago: 'Efectivo',
        items: [],
      },
    ];

    const clientes: Cliente[] = [
      { id: 'c-1', nombreApellido: 'Ana Gómez', saldoPendiente: 8000 },
      { id: 'c-2', nombreApellido: 'Carlos Pérez', saldoPendiente: 0 },
      { id: 'c-3', nombreApellido: 'Lucía Rossi', saldoPendiente: 2500 },
    ];

    it('calcula totales de ventas cobradas, pendientes y clientes deudores', () => {
      const resumen = calcularResumenFinanciero(ventas, clientes);
      expect(resumen.totalCobrado).toBe(15000);
      expect(resumen.totalPendiente).toBe(10500); // 8000 + 2500 de clientes
      expect(resumen.totalVentas).toBe(4);
      expect(resumen.clientesConDeuda).toBe(2);
    });
  });

  describe('validarDatosNuevaVenta', () => {
    it('valida exitosamente una venta con items válidos', () => {
      const resultado = validarDatosNuevaVenta({
        estadoPago: 'Cobrado',
        metodoPago: 'Efectivo',
        items: [{ productoId: 'prod-1', cantidad: 2, precioUnitario: 3500 }],
      });
      expect(resultado.valido).toBe(true);
      expect(resultado.error).toBeUndefined();
    });

    it('falla si no tiene items', () => {
      const resultado = validarDatosNuevaVenta({
        estadoPago: 'Cobrado',
        metodoPago: 'Efectivo',
        items: [],
      });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('Debe incluir al menos un producto');
    });

    it('falla si algún item tiene cantidad menor o igual a cero', () => {
      const resultado = validarDatosNuevaVenta({
        estadoPago: 'Cobrado',
        metodoPago: 'Efectivo',
        items: [{ productoId: 'prod-1', cantidad: 0, precioUnitario: 3500 }],
      });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('mayor a cero');
    });

    it('falla si el precio es negativo', () => {
      const resultado = validarDatosNuevaVenta({
        estadoPago: 'Cobrado',
        metodoPago: 'Efectivo',
        items: [{ productoId: 'prod-1', cantidad: 1, precioUnitario: -50 }],
      });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('precio');
    });
  });
});
