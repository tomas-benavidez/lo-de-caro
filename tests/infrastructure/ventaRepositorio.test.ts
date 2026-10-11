import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VentaRepositorio,
  mapearFilaAVenta,
  VentaFila,
} from '../../src/infrastructure/repositories/ventaRepositorio.ts';
import { NuevaVentaInput } from '../../src/domain/models/venta.ts';

describe('VentaRepositorio & Mapeadores', () => {
  describe('mapearFilaAVenta', () => {
    it('mapea correctamente una fila con join de cliente y venta_items', () => {
      const fila: VentaFila = {
        id: 'v-100',
        fecha: '2026-10-10',
        cliente_id: 'c-1',
        total: 9000,
        estado_pago: 'Pagado',
        created_at: '2026-10-10T12:00:00Z',
        clientes: {
          nombre_apellido: 'Verónica Molina',
        },
        venta_items: [
          {
            id: 'vi-1',
            venta_id: 'v-100',
            producto_id: 'prod-1',
            cantidad: 2,
            precio_unitario: 4500,
            subtotal: 9000,
            productos: {
              nombre: 'Ravioles',
              unidad_venta: 'Porcion',
            },
          },
        ],
      };

      const venta = mapearFilaAVenta(fila);
      expect(venta.id).toBe('v-100');
      expect(venta.nombreCliente).toBe('Verónica Molina');
      expect(venta.estadoPago).toBe('Cobrado');
      expect(venta.total).toBe(9000);
      expect(venta.items).toHaveLength(1);
      expect(venta.items[0].nombreProducto).toBe('Ravioles');
      expect(venta.items[0].cantidad).toBe(2);
    });

    it('asigna Cliente Mostrador si cliente_id o clientes es nulo', () => {
      const fila: VentaFila = {
        id: 'v-101',
        fecha: '2026-10-10',
        cliente_id: null,
        total: 5000,
        estado_pago: 'Pendiente',
        created_at: '2026-10-10T13:00:00Z',
        clientes: null,
        venta_items: [],
      };

      const venta = mapearFilaAVenta(fila);
      expect(venta.nombreCliente).toBe('Cliente Mostrador');
      expect(venta.estadoPago).toBe('Pendiente');
    });
  });

  describe('Métodos del Repositorio con Mock de Supabase', () => {
    let mockSupabase: any;
    let repo: VentaRepositorio;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn(),
      };
      repo = new VentaRepositorio(mockSupabase);
    });

    it('debe registrar una venta en estado Cobrado y descontar stock del freezer', async () => {
      // 1. Inserción de venta
      const mockSingleVenta = vi.fn().mockResolvedValue({
        data: {
          id: 'v-1',
          fecha: '2026-10-10',
          cliente_id: null,
          total: 8000,
          estado_pago: 'Pagado',
        },
        error: null,
      });
      const mockSelectVenta = vi.fn().mockReturnValue({ single: mockSingleVenta });
      const mockInsertVenta = vi.fn().mockReturnValue({ select: mockSelectVenta });

      // 2. Inserción de venta_items
      const mockInsertItems = vi.fn().mockResolvedValue({ error: null });

      // 3. Descuento en productos (stockActual: 10 -> nuevo: 8)
      const mockSingleProd = vi.fn().mockResolvedValue({
        data: { id: 'p-1', stock_actual: 10, nombre: 'Empanadas' },
        error: null,
      });
      const mockEqSelectProd = vi.fn().mockReturnValue({ single: mockSingleProd });
      const mockSelectProd = vi.fn().mockReturnValue({ eq: mockEqSelectProd });
      const mockEqUpdateProd = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateProd = vi.fn().mockReturnValue({ eq: mockEqUpdateProd });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'ventas') {
          return { insert: mockInsertVenta };
        }
        if (tabla === 'venta_items') {
          return { insert: mockInsertItems };
        }
        if (tabla === 'productos') {
          return { select: mockSelectProd, update: mockUpdateProd };
        }
        return {};
      });

      const input: NuevaVentaInput = {
        fecha: '2026-10-10',
        clienteId: null,
        estadoPago: 'Cobrado',
        metodoPago: 'Efectivo',
        items: [{ productoId: 'p-1', cantidad: 2, precioUnitario: 4000 }],
      };

      const resultado = await repo.registrarVenta(input);
      expect(resultado.id).toBe('v-1');
      expect(resultado.total).toBe(8000);
      expect(mockInsertVenta).toHaveBeenCalledWith({
        fecha: '2026-10-10',
        cliente_id: null,
        total: 8000,
        estado_pago: 'Pagado',
      });
      expect(mockInsertItems).toHaveBeenCalledWith([
        {
          venta_id: 'v-1',
          producto_id: 'p-1',
          cantidad: 2,
          precio_unitario: 4000,
          subtotal: 8000,
        },
      ]);
      expect(mockUpdateProd).toHaveBeenCalledWith({ stock_actual: 8 });
    });

    it('debe registrar una venta en estado Pendiente e incrementar el saldo_pendiente del cliente', async () => {
      // 1. Inserción de venta
      const mockSingleVenta = vi.fn().mockResolvedValue({
        data: {
          id: 'v-2',
          fecha: '2026-10-10',
          cliente_id: 'c-1',
          total: 5000,
          estado_pago: 'Pendiente',
        },
        error: null,
      });
      const mockSelectVenta = vi.fn().mockReturnValue({ single: mockSingleVenta });
      const mockInsertVenta = vi.fn().mockReturnValue({ select: mockSelectVenta });

      // 2. Inserción de items
      const mockInsertItems = vi.fn().mockResolvedValue({ error: null });

      // 3. Descuento productos
      const mockSingleProd = vi.fn().mockResolvedValue({
        data: { id: 'p-1', stock_actual: 5, nombre: 'Pastas' },
        error: null,
      });
      const mockEqSelectProd = vi.fn().mockReturnValue({ single: mockSingleProd });
      const mockSelectProd = vi.fn().mockReturnValue({ eq: mockEqSelectProd });
      const mockEqUpdateProd = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateProd = vi.fn().mockReturnValue({ eq: mockEqUpdateProd });

      // 4. Incremento saldo cliente (actual: 1000 -> nuevo: 6000)
      const mockSingleCliente = vi.fn().mockResolvedValue({
        data: { id: 'c-1', saldo_pendiente: 1000 },
        error: null,
      });
      const mockEqSelectCliente = vi.fn().mockReturnValue({ single: mockSingleCliente });
      const mockSelectCliente = vi.fn().mockReturnValue({ eq: mockEqSelectCliente });
      const mockEqUpdateCliente = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateCliente = vi.fn().mockReturnValue({ eq: mockEqUpdateCliente });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'ventas') return { insert: mockInsertVenta };
        if (tabla === 'venta_items') return { insert: mockInsertItems };
        if (tabla === 'productos') return { select: mockSelectProd, update: mockUpdateProd };
        if (tabla === 'clientes') return { select: mockSelectCliente, update: mockUpdateCliente };
        return {};
      });

      const input: NuevaVentaInput = {
        fecha: '2026-10-10',
        clienteId: 'c-1',
        estadoPago: 'Pendiente',
        metodoPago: 'Efectivo',
        items: [{ productoId: 'p-1', cantidad: 1, precioUnitario: 5000 }],
      };

      const resultado = await repo.registrarVenta(input);
      expect(resultado.id).toBe('v-2');
      expect(resultado.estadoPago).toBe('Pendiente');
      expect(mockUpdateCliente).toHaveBeenCalledWith({ saldo_pendiente: 6000 });
    });

    it('debe ejecutar rollback defensivo si falla el descuento de stock de productos', async () => {
      // 1. Inserción de venta exitosa
      const mockSingleVenta = vi.fn().mockResolvedValue({
        data: { id: 'v-fallo', total: 4000, estado_pago: 'Pagado' },
        error: null,
      });
      const mockSelectVenta = vi.fn().mockReturnValue({ single: mockSingleVenta });
      const mockInsertVenta = vi.fn().mockReturnValue({ select: mockSelectVenta });

      // 2. Inserción de items exitosa
      const mockInsertItems = vi.fn().mockResolvedValue({ error: null });

      // 3. Fallo al actualizar producto
      const mockSingleProd = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Error de red en productos' },
      });
      const mockEqSelectProd = vi.fn().mockReturnValue({ single: mockSingleProd });
      const mockSelectProd = vi.fn().mockReturnValue({ eq: mockEqSelectProd });

      // 4. Delete de rollback
      const mockEqDeleteVenta = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteVenta = vi.fn().mockReturnValue({ eq: mockEqDeleteVenta });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'ventas') {
          return { insert: mockInsertVenta, delete: mockDeleteVenta };
        }
        if (tabla === 'venta_items') {
          return { insert: mockInsertItems };
        }
        if (tabla === 'productos') {
          return { select: mockSelectProd };
        }
        return {};
      });

      const input: NuevaVentaInput = {
        estadoPago: 'Cobrado',
        metodoPago: 'Efectivo',
        items: [{ productoId: 'p-error', cantidad: 1, precioUnitario: 4000 }],
      };

      await expect(repo.registrarVenta(input)).rejects.toThrow('Error de red en productos');
      expect(mockDeleteVenta).toHaveBeenCalled();
      expect(mockEqDeleteVenta).toHaveBeenCalledWith('id', 'v-fallo');
    });

    it('debe anular una venta restituyendo el stock y ajustando la deuda si era Pendiente', async () => {
      // 1. Fetch de la venta a anular
      const mockSingleFetch = vi.fn().mockResolvedValue({
        data: {
          id: 'v-anular',
          cliente_id: 'c-1',
          total: 5000,
          estado_pago: 'Pendiente',
          venta_items: [
            { producto_id: 'p-1', cantidad: 2 },
          ],
        },
        error: null,
      });
      const mockEqFetch = vi.fn().mockReturnValue({ single: mockSingleFetch });
      const mockSelectVenta = vi.fn().mockReturnValue({ eq: mockEqFetch });

      // 2. Restitución producto
      const mockSingleProd = vi.fn().mockResolvedValue({
        data: { id: 'p-1', stock_actual: 8 },
        error: null,
      });
      const mockEqSelectProd = vi.fn().mockReturnValue({ single: mockSingleProd });
      const mockSelectProd = vi.fn().mockReturnValue({ eq: mockEqSelectProd });
      const mockEqUpdateProd = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateProd = vi.fn().mockReturnValue({ eq: mockEqUpdateProd });

      // 3. Ajuste deuda cliente (5000 - 5000 = 0)
      const mockSingleCliente = vi.fn().mockResolvedValue({
        data: { id: 'c-1', saldo_pendiente: 5000 },
        error: null,
      });
      const mockEqSelectCliente = vi.fn().mockReturnValue({ single: mockSingleCliente });
      const mockSelectCliente = vi.fn().mockReturnValue({ eq: mockEqSelectCliente });
      const mockEqUpdateCliente = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateCliente = vi.fn().mockReturnValue({ eq: mockEqUpdateCliente });

      // 4. Delete de la venta
      const mockEqDelete = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteVenta = vi.fn().mockReturnValue({ eq: mockEqDelete });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'ventas') {
          return { select: mockSelectVenta, delete: mockDeleteVenta };
        }
        if (tabla === 'productos') {
          return { select: mockSelectProd, update: mockUpdateProd };
        }
        if (tabla === 'clientes') {
          return { select: mockSelectCliente, update: mockUpdateCliente };
        }
        return {};
      });

      await repo.anularVenta('v-anular');

      // Verificaciones
      expect(mockUpdateProd).toHaveBeenCalledWith({ stock_actual: 10 }); // 8 + 2
      expect(mockUpdateCliente).toHaveBeenCalledWith({ saldo_pendiente: 0 }); // 5000 - 5000
      expect(mockDeleteVenta).toHaveBeenCalled();
      expect(mockEqDelete).toHaveBeenCalledWith('id', 'v-anular');
    });

    it('debe saldar ventas pendientes en orden cronológico hasta agotar el monto del pago', async () => {
      const mockVentasPendientes = [
        {
          id: 'v-p1',
          fecha: '2026-10-08',
          cliente_id: 'c-1',
          total: 3000,
          estado_pago: 'Pendiente',
          created_at: '2026-10-08T10:00:00Z',
          clientes: { nombre_apellido: 'Verónica' },
          venta_items: [],
        },
        {
          id: 'v-p2',
          fecha: '2026-10-09',
          cliente_id: 'c-1',
          total: 4000,
          estado_pago: 'Pendiente',
          created_at: '2026-10-09T10:00:00Z',
          clientes: { nombre_apellido: 'Verónica' },
          venta_items: [],
        },
      ];

      const mockOrderCreatedAt = vi.fn().mockResolvedValue({
        data: mockVentasPendientes,
        error: null,
      });
      const mockOrderFecha = vi.fn().mockReturnValue({ order: mockOrderCreatedAt });
      const mockEqEstado = vi.fn().mockReturnValue({ order: mockOrderFecha });
      const mockEqCliente = vi.fn().mockReturnValue({ eq: mockEqEstado });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqCliente });

      const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'ventas') {
          return { select: mockSelect, update: mockUpdate };
        }
        return {};
      });

      // Pagamos 5000: debe saldar v-p1 (3000), remanente 2000 no alcanza para v-p2 (4000)
      const saldadas = await repo.saldarVentasPendientes('c-1', 5000, 'Transferencia');

      expect(saldadas).toHaveLength(1);
      expect(saldadas[0].id).toBe('v-p1');
      expect(saldadas[0].estadoPago).toBe('Cobrado');
      expect(saldadas[0].metodoPago).toBe('Transferencia');
      expect(mockUpdate).toHaveBeenCalledWith({ estado_pago: 'Pagado' });
      expect(mockEqUpdate).toHaveBeenCalledWith('id', 'v-p1');
    });
  });
});

