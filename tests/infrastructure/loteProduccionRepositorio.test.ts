import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LoteProduccionRepositorio,
  mapearFilaALoteProduccion,
  LoteProduccionFila,
  NuevoLoteProduccionInput,
} from '../../src/infrastructure/repositories/loteProduccionRepositorio.ts';
import { RecetaIngredienteItem } from '../../src/domain/models/producto.ts';

describe('LoteProduccionRepositorio & Mapeadores', () => {
  describe('mapearFilaALoteProduccion', () => {
    it('mapea correctamente una fila con join de producto a la entidad LoteProduccion', () => {
      const fila: LoteProduccionFila = {
        id: 'lote-123',
        fecha: '2026-10-10',
        producto_id: 'prod-456',
        cantidad_elaborada: 15,
        observaciones: 'Tanda matutina de pastas',
        created_at: '2026-10-10T12:00:00Z',
        productos: {
          id: 'prod-456',
          nombre: 'Raviolones de Verdura',
          categoria: 'Pastas Rellenas',
          unidad_venta: 'Porcion',
        },
      };

      const entidad = mapearFilaALoteProduccion(fila);

      expect(entidad.id).toBe('lote-123');
      expect(entidad.fecha).toBe('2026-10-10');
      expect(entidad.productoId).toBe('prod-456');
      expect(entidad.nombreProducto).toBe('Raviolones de Verdura');
      expect(entidad.categoria).toBe('Pastas Rellenas');
      expect(entidad.unidadVenta).toBe('Porcion');
      expect(entidad.cantidadElaborada).toBe(15);
      expect(entidad.observaciones).toBe('Tanda matutina de pastas');
    });

    it('asigna valores por defecto si el join de productos viene nulo', () => {
      const fila: LoteProduccionFila = {
        id: 'lote-999',
        fecha: '2026-10-10',
        producto_id: 'prod-desconocido',
        cantidad_elaborada: 5,
        observaciones: null,
        created_at: '2026-10-10T14:00:00Z',
        productos: null,
      };

      const entidad = mapearFilaALoteProduccion(fila);

      expect(entidad.nombreProducto).toBe('Producto eliminado');
      expect(entidad.unidadVenta).toBe('u');
      expect(entidad.observaciones).toBeUndefined();
    });
  });

  describe('Métodos del Repositorio con Mock de Supabase', () => {
    let mockSupabase: any;
    let repositorio: LoteProduccionRepositorio;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn(),
      };
      repositorio = new LoteProduccionRepositorio(mockSupabase);
    });

    it('debe listar lotes ordenados de forma descendente', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      const filasSimuladas: LoteProduccionFila[] = [
        {
          id: 'lote-1',
          fecha: '2026-10-10',
          producto_id: 'prod-1',
          cantidad_elaborada: 10,
          observaciones: 'Lote 1',
          productos: {
            id: 'prod-1',
            nombre: 'Tallarines',
            categoria: 'Pastas Lisas',
            unidad_venta: 'Kilo',
          },
        },
      ];

      // Segunda llamada a order resuelve con data
      mockQueryBuilder.order
        .mockReturnValueOnce(mockQueryBuilder)
        .mockResolvedValueOnce({ data: filasSimuladas, error: null });

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const lotes = await repositorio.listarLotes();

      expect(mockSupabase.from).toHaveBeenCalledWith('lotes_produccion');
      expect(lotes).toHaveLength(1);
      expect(lotes[0].nombreProducto).toBe('Tallarines');
      expect(lotes[0].cantidadElaborada).toBe(10);
    });

    it('debe registrar un lote de produccion actualizando stock de producto y materias primas', async () => {
      const nuevoLote: NuevoLoteProduccionInput = {
        productoId: 'prod-1',
        cantidadElaborada: 10,
        fecha: '2026-10-10',
        observaciones: 'Producción de prueba',
      };

      const ingredientes: RecetaIngredienteItem[] = [
        {
          id: 'ri-1',
          materiaPrimaId: 'mp-harina',
          nombreMateriaPrima: 'Harina',
          cantidad: 0.5,
          unidadMedida: 'kg',
          costoUnitario: 1000,
        },
      ];

      // Configuración de mocks para cada tabla
      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'lotes_produccion') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'lote-nuevo',
                    fecha: '2026-10-10',
                    producto_id: 'prod-1',
                    cantidad_elaborada: 10,
                    observaciones: 'Producción de prueba',
                    created_at: '2026-10-10T12:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'lote-nuevo',
                    fecha: '2026-10-10',
                    producto_id: 'prod-1',
                    cantidad_elaborada: 10,
                    observaciones: 'Producción de prueba',
                    productos: {
                      id: 'prod-1',
                      nombre: 'Tallarines',
                      categoria: 'Pastas Lisas',
                      unidad_venta: 'Kilo',
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (tabla === 'productos') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'prod-1', stock_actual: 5 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }

        if (tabla === 'materias_primas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'mp-harina', stock_actual: 20 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }

        throw new Error(`Tabla no mockeada: ${tabla}`);
      });

      const loteCreado = await repositorio.registrarProduccion(nuevoLote, ingredientes);

      expect(loteCreado.id).toBe('lote-nuevo');
      expect(loteCreado.nombreProducto).toBe('Tallarines');
      expect(loteCreado.cantidadElaborada).toBe(10);
    });

    it('debe ejecutar rollback eliminando el lote si falla la actualizacion de materias primas', async () => {
      const nuevoLote: NuevoLoteProduccionInput = {
        productoId: 'prod-1',
        cantidadElaborada: 5,
      };

      const ingredientes: RecetaIngredienteItem[] = [
        {
          id: 'ri-1',
          materiaPrimaId: 'mp-harina',
          nombreMateriaPrima: 'Harina',
          cantidad: 0.5,
          unidadMedida: 'kg',
          costoUnitario: 1000,
        },
      ];

      const deleteLoteMock = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'lotes_produccion') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'lote-a-borrar', producto_id: 'prod-1', cantidad_elaborada: 5 },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: deleteLoteMock,
            }),
          };
        }
        if (tabla === 'productos') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { stock_actual: 0 }, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (tabla === 'materias_primas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Fallo de red en materias_primas' },
                }),
              }),
            }),
          };
        }
      });

      await expect(repositorio.registrarProduccion(nuevoLote, ingredientes)).rejects.toThrow(
        /Error al actualizar stock de materias primas/
      );

      // Verificamos que se ejecutó el rollback de eliminación del lote
      expect(deleteLoteMock).toHaveBeenCalledWith('id', 'lote-a-borrar');
    });

    it('debe eliminar un lote por id', async () => {
      const deleteMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: deleteMock,
        }),
      });

      await repositorio.eliminarLote('lote-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('lotes_produccion');
      expect(deleteMock).toHaveBeenCalledWith('id', 'lote-123');
    });
  });
});
