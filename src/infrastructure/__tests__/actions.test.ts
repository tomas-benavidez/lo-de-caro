import { describe, it, expect, vi, beforeEach } from 'vitest';

// Utilizar vi.hoisted para definir los mocks antes de que se importen las dependencias
const { 
  mockSupabaseClient, 
  mockSingle, 
  mockInsert, 
  mockSelect, 
  mockUpdate, 
  mockDelete, 
  mockEq, 
  mockRpc 
} = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockRpc = vi.fn();

  const mockSupabaseClient = {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    }),
    rpc: mockRpc,
  };

  return { 
    mockSupabaseClient, 
    mockSingle, 
    mockInsert, 
    mockSelect, 
    mockUpdate, 
    mockDelete, 
    mockEq, 
    mockRpc 
  };
});

// Mock de la conexión de cookies de Next.js
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}));

// Mock del cliente de Supabase Server
vi.mock('../supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabaseClient),
}));

// Ahora sí importamos las acciones seguras
import { registrarCompraInsumo } from '../actions/insumos';
import { createReceta } from '../actions/recetas';
import { registrarLoteProduccion } from '../actions/lotes';
import { registrarVenta } from '../actions/ventas';

describe('Integration Tests - Supabase Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar retornos por defecto para evitar crashes
    mockSelect.mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }), order: vi.fn() });
    mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }) });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
    mockDelete.mockReturnValue({ eq: mockEq });
  });

  describe('Insumos Server Actions', () => {
    it('debería calcular y actualizar el costo promedio ponderado correctamente al registrar compra', async () => {
      // 1. Primer llamado de select.eq.single para obtener el insumo actual
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'insumo-123',
          nombre: 'Harina',
          stock_actual: 10,
          costo_bruto_unitario: 1.5, // 10 unidades a 1.5 = 15 total
        },
        error: null,
      });

      // 2. Segundo llamado de update.eq.select.single para devolver el insumo actualizado
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'insumo-123',
          nombre: 'Harina',
          stock_actual: 30,
          costo_bruto_unitario: 1.8333, // (15 + 40) / 30 = 1.8333
        },
        error: null,
      });

      const result = await registrarCompraInsumo('insumo-123', 40, 20); // Compra: 20u por 40 pesos (unitario = 2)

      expect(result.stock_actual).toBe(30);
      expect(result.costo_bruto_unitario).toBe(1.8333);
    });
  });

  describe('Recetas Server Actions', () => {
    it('debería insertar la receta y sus ingredientes exitosamente', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'receta-123', nombre: 'Pasta', porciones_rendimiento: 4, costo_envase: 10 },
        error: null,
      });

      mockInsert.mockReturnValueOnce({ select: vi.fn().mockReturnValue({ single: mockSingle }) }) // para receta
                 .mockResolvedValueOnce({ data: [], error: null }); // para receta_ingredientes

      const ingredientes = [
        { insumo_id: 'insumo-1', peso_limpio: 500, porcentaje_merma: 5 },
      ];

      const result = await createReceta('Pasta', 4, 10, ingredientes);

      expect(result.id).toBe('receta-123');
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('debería limpiar la receta creada si falla la inserción de sus ingredientes (orphan cleanup)', async () => {
      // 1. Simular creación de receta exitosa
      mockSingle.mockResolvedValueOnce({
        data: { id: 'receta-123', nombre: 'Pasta Fail', porciones_rendimiento: 4, costo_envase: 10 },
        error: null,
      });

      // 2. Simular fallo al insertar ingredientes
      mockInsert.mockReturnValueOnce({ select: vi.fn().mockReturnValue({ single: mockSingle }) }) // para receta
                 .mockResolvedValueOnce({ data: null, error: new Error('Database constraint violation') }); // para ingredientes

      const ingredientes = [
        { insumo_id: 'insumo-1', peso_limpio: 500, porcentaje_merma: 5 },
      ];

      await expect(createReceta('Pasta Fail', 4, 10, ingredientes)).rejects.toThrow('Error al insertar ingredientes de receta');

      // Verificar que se llamó a la limpieza (delete)
      expect(mockDelete).toHaveBeenCalledWith();
      expect(mockEq).toHaveBeenCalledWith('id', 'receta-123');
    });
  });

  describe('Lotes de Producción Server Actions (RPC)', () => {
    it('debería invocar la RPC transaccional correctamente al registrar lote', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'lote-123', error: null });

      const ingredientes = [
        { insumo_id: 'insumo-1', cantidad_bruta_consumida: 526.32 },
      ];

      const result = await registrarLoteProduccion('2026-06-25', 'receta-123', 10, 'profile-123', ingredientes);

      expect(result).toBe('lote-123');
      expect(mockRpc).toHaveBeenCalledWith('registrar_lote_produccion_trx', {
        p_fecha: '2026-06-25',
        p_receta_id: 'receta-123',
        p_cantidad_producida: 10,
        p_registrado_por: 'profile-123',
        p_ingredientes: ingredientes,
      });
    });
  });

  describe('Ventas Server Actions (RPC)', () => {
    it('debería invocar la RPC transaccional correctamente al registrar venta', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'venta-123', error: null });

      const items = [
        { producto_id: 'producto-1', cantidad: 2, precio_cobrado_real: 1500 },
      ];

      const result = await registrarVenta('cliente-123', 'Cobrada', 'profile-123', items);

      expect(result).toBe('venta-123');
      expect(mockRpc).toHaveBeenCalledWith('registrar_venta_trx', {
        p_cliente_id: 'cliente-123',
        p_estado_cobro: 'Cobrada',
        p_registrado_por: 'profile-123',
        p_items: items,
      });
    });
  });
});
