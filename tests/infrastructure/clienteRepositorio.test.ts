import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ClienteRepositorio,
  mapearFilaACliente,
  ClienteFila,
} from '../../src/infrastructure/repositories/clienteRepositorio.ts';

describe('ClienteRepositorio & Mapeadores', () => {
  describe('mapearFilaACliente', () => {
    it('mapea una fila snake_case de Postgres a la entidad Cliente camelCase', () => {
      const fila: ClienteFila = {
        id: 'c-1',
        nombre_apellido: 'Verónica Molina',
        telefono: '1122334455',
        saldo_pendiente: 4500,
        created_at: '2026-10-10T10:00:00Z',
      };

      const cliente = mapearFilaACliente(fila);
      expect(cliente.id).toBe('c-1');
      expect(cliente.nombreApellido).toBe('Verónica Molina');
      expect(cliente.telefono).toBe('1122334455');
      expect(cliente.saldoPendiente).toBe(4500);
      expect(cliente.fechaCreacion).toBe('2026-10-10T10:00:00Z');
    });

    it('asigna 0 como saldo pendiente si viene nulo', () => {
      const fila: ClienteFila = {
        id: 'c-2',
        nombre_apellido: 'Nehuén',
        telefono: null,
        saldo_pendiente: null as any,
        created_at: '2026-10-10T11:00:00Z',
      };

      const cliente = mapearFilaACliente(fila);
      expect(cliente.saldoPendiente).toBe(0);
      expect(cliente.telefono).toBeNull();
    });
  });

  describe('Métodos del Repositorio con Mock de Supabase', () => {
    let mockSupabase: any;
    let repo: ClienteRepositorio;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn(),
      };
      repo = new ClienteRepositorio(mockSupabase);
    });

    it('debe listar clientes ordenados alfabéticamente', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { id: '1', nombre_apellido: 'Ana', telefono: '123', saldo_pendiente: 0, created_at: '2026-10-10' },
          { id: '2', nombre_apellido: 'Beto', telefono: '456', saldo_pendiente: 500, created_at: '2026-10-10' },
        ],
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const clientes = await repo.listar();
      expect(clientes).toHaveLength(2);
      expect(clientes[0].nombreApellido).toBe('Ana');
      expect(mockOrder).toHaveBeenCalledWith('nombre_apellido', { ascending: true });
    });

    it('debe crear un nuevo cliente con saldo 0', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'new-id', nombre_apellido: 'Carlos', telefono: '789', saldo_pendiente: 0 },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const creado = await repo.crear({ nombreApellido: 'Carlos', telefono: '789' });
      expect(creado.id).toBe('new-id');
      expect(creado.nombreApellido).toBe('Carlos');
      expect(mockInsert).toHaveBeenCalledWith({
        nombre_apellido: 'Carlos',
        telefono: '789',
        saldo_pendiente: 0,
      });
    });

    it('debe registrar un pago de deuda decrementando el saldo pendiente', async () => {
      // 1. Lectura del saldo actual
      const mockSingleFetch = vi.fn().mockResolvedValue({
        data: { id: 'c-1', nombre_apellido: 'Ana', saldo_pendiente: 5000 },
        error: null,
      });
      const mockEqFetch = vi.fn().mockReturnValue({ single: mockSingleFetch });
      const mockSelectFetch = vi.fn().mockReturnValue({ eq: mockEqFetch });

      // 2. Update del nuevo saldo
      const mockSingleUpdate = vi.fn().mockResolvedValue({
        data: { id: 'c-1', nombre_apellido: 'Ana', saldo_pendiente: 2000 },
        error: null,
      });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'clientes') {
          return {
            select: mockSelectFetch,
            update: mockUpdate,
          };
        }
        return {};
      });

      const actualizado = await repo.registrarPagoDeuda({
        clienteId: 'c-1',
        monto: 3000,
        metodoPago: 'Transferencia',
      });

      expect(actualizado.saldoPendiente).toBe(2000);
      expect(mockUpdate).toHaveBeenCalledWith({ saldo_pendiente: 2000 });
    });

    it('debe rechazar montos menores o iguales a cero en registrarPagoDeuda', async () => {
      await expect(
        repo.registrarPagoDeuda({
          clienteId: 'c-1',
          monto: 0,
          metodoPago: 'Efectivo',
        })
      ).rejects.toThrow('El monto a abonar debe ser mayor a cero.');

      await expect(
        repo.registrarPagoDeuda({
          clienteId: 'c-1',
          monto: -500,
          metodoPago: 'Efectivo',
        })
      ).rejects.toThrow('El monto a abonar debe ser mayor a cero.');
    });
  });
});

