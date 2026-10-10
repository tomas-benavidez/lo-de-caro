import { describe, it, expect, vi } from 'vitest';
import {
  ProductoRepositorio,
  mapearFilaAProducto,
  mapearProductoAFila,
  consolidarIngredientes,
  ProductoFila,
  NuevoProductoInput,
} from '../../src/infrastructure/repositories/productoRepositorio.ts';

describe('ProductoRepositorio & Mapeadores', () => {
  it('mapea correctamente una fila con join de recetas y materias primas a la entidad Producto', () => {
    const filaMock: ProductoFila = {
      id: 'prod-001',
      nombre: 'Raviolones de Osobuco',
      categoria: 'Pastas Rellenas',
      unidad_venta: 'Porcion',
      precio_lista: '7500.00',
      stock_actual: '12',
      stock_minimo: '5',
      activo: true,
      created_at: '2026-10-10T12:00:00Z',
      updated_at: '2026-10-10T12:00:00Z',
      receta_ingredientes: [
        {
          id: 'ri-001',
          producto_id: 'prod-001',
          materia_prima_id: 'mp-001',
          cantidad: '0.25',
          materias_primas: {
            id: 'mp-001',
            nombre: 'Harina 0000',
            unidad_medida: 'kg',
            costo_unitario: '1200.00',
          },
        },
        {
          id: 'ri-002',
          producto_id: 'prod-001',
          materia_prima_id: 'mp-002',
          cantidad: '1',
          materias_primas: {
            id: 'mp-002',
            nombre: 'Huevos',
            unidad_medida: 'u',
            costo_unitario: '120.00',
          },
        },
      ],
    };

    const entidad = mapearFilaAProducto(filaMock);

    expect(entidad.id).toBe('prod-001');
    expect(entidad.nombre).toBe('Raviolones de Osobuco');
    expect(entidad.categoria).toBe('Pastas Rellenas');
    expect(entidad.unidadVenta).toBe('Porcion');
    expect(entidad.precioLista).toBe(7500);
    expect(entidad.stockActual).toBe(12);
    expect(entidad.stockMinimo).toBe(5);
    expect(entidad.activo).toBe(true);
    expect(entidad.ingredientes).toHaveLength(2);
    expect(entidad.ingredientes[0]).toEqual({
      id: 'ri-001',
      materiaPrimaId: 'mp-001',
      nombreMateriaPrima: 'Harina 0000',
      cantidad: 0.25,
      unidadMedida: 'kg',
      costoUnitario: 1200,
    });
    expect(entidad.ingredientes[1]).toEqual({
      id: 'ri-002',
      materiaPrimaId: 'mp-002',
      nombreMateriaPrima: 'Huevos',
      cantidad: 1,
      unidadMedida: 'u',
      costoUnitario: 120,
    });
  });

  it('mapea correctamente un producto sin ingredientes asociados', () => {
    const filaMock: ProductoFila = {
      id: 'prod-002',
      nombre: 'Empanadas de Carne',
      categoria: 'Empanadas',
      unidad_venta: 'Docena',
      precio_lista: '9000',
      stock_actual: '0',
      stock_minimo: '5',
      activo: true,
      receta_ingredientes: [],
    };

    const entidad = mapearFilaAProducto(filaMock);
    expect(entidad.ingredientes).toEqual([]);
    expect(entidad.precioLista).toBe(9000);
  });

  it('mapea un input del dominio a formato persistible en Postgres', () => {
    const input: NuevoProductoInput = {
      nombre: ' Tarta de Atún ',
      categoria: 'Tartas',
      unidadVenta: 'Unidad',
      precioLista: 8500,
      stockActual: 4,
      stockMinimo: 2,
    };

    const fila = mapearProductoAFila(input);

    expect(fila).toEqual({
      nombre: 'Tarta de Atún',
      categoria: 'Tartas',
      unidad_venta: 'Unidad',
      precio_lista: 8500,
      stock_actual: 4,
      stock_minimo: 2,
      activo: true,
    });
  });

  it('debe listar productos activos con sus recetas a través del cliente', async () => {
    const productosMock = [
      {
        id: 'prod-1',
        nombre: 'Fideos Caseros',
        categoria: 'Pastas Lisas',
        unidad_venta: 'Porcion',
        precio_lista: 4000,
        stock_actual: 10,
        stock_minimo: 5,
        activo: true,
        receta_ingredientes: [],
      },
    ];

    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: productosMock,
              error: null,
            }),
          }),
        }),
      }),
    };

    const repo = new ProductoRepositorio(supabaseMock as any);
    const resultado = await repo.listar();

    expect(supabaseMock.from).toHaveBeenCalledWith('productos');
    expect(resultado).toHaveLength(1);
    expect(resultado[0].nombre).toBe('Fideos Caseros');
  });

  it('debe crear un producto con sus ingredientes asociados', async () => {
    const productoCreadoFila = {
      id: 'prod-nuevo-1',
      nombre: 'Salsa Fileto',
      categoria: 'Salsas',
      unidad_venta: 'Porcion',
      precio_lista: 2500,
      stock_actual: 0,
      stock_minimo: 5,
      activo: true,
      receta_ingredientes: [
        {
          id: 'ri-10',
          producto_id: 'prod-nuevo-1',
          materia_prima_id: 'mp-tomate',
          cantidad: 0.3,
          materias_primas: {
            id: 'mp-tomate',
            nombre: 'Tomate triturado',
            unidad_medida: 'kg',
            costo_unitario: 1500,
          },
        },
      ],
    };

    const supabaseMock = {
      from: vi.fn((tabla: string) => {
        if (tabla === 'productos') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'prod-nuevo-1', nombre: 'Salsa Fileto' },
                  error: null,
                }),
              }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: productoCreadoFila,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (tabla === 'receta_ingredientes') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    };

    const repo = new ProductoRepositorio(supabaseMock as any);
    const resultado = await repo.crear(
      {
        nombre: 'Salsa Fileto',
        categoria: 'Salsas',
        unidadVenta: 'Porcion',
        precioLista: 2500,
      },
      [
        {
          materiaPrimaId: 'mp-tomate',
          cantidad: 0.3,
        },
      ]
    );

    expect(resultado.id).toBe('prod-nuevo-1');
    expect(resultado.ingredientes).toHaveLength(1);
    expect(resultado.ingredientes[0].nombreMateriaPrima).toBe('Tomate triturado');
  });

  it('debe eliminar un producto por su id exitosamente', async () => {
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
    };

    const repo = new ProductoRepositorio(supabaseMock as any);
    await expect(repo.eliminar('prod-123')).resolves.not.toThrow();
    expect(supabaseMock.from).toHaveBeenCalledWith('productos');
  });

  it('debe consolidar ingredientes duplicados sumando sus cantidades y filtrando no válidos', () => {
    const inputs = [
      { materiaPrimaId: 'mp-harina', cantidad: 0.2 },
      { materiaPrimaId: 'mp-huevos', cantidad: 2 },
      { materiaPrimaId: 'mp-harina', cantidad: 0.1 },
      { materiaPrimaId: 'mp-sal', cantidad: 0 },
      { materiaPrimaId: 'mp-invalido', cantidad: -1 },
    ];

    const consolidados = consolidarIngredientes(inputs);

    expect(consolidados).toHaveLength(2);
    const harina = consolidados.find((i) => i.materiaPrimaId === 'mp-harina');
    const huevos = consolidados.find((i) => i.materiaPrimaId === 'mp-huevos');
    expect(harina?.cantidad).toBe(0.3);
    expect(huevos?.cantidad).toBe(2);
  });

  it('debe hacer rollback eliminando el producto creado si falla la inserción de ingredientes', async () => {
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

    const supabaseMock = {
      from: vi.fn((tabla: string) => {
        if (tabla === 'productos') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'prod-fallido-1', nombre: 'Tarta' },
                  error: null,
                }),
              }),
            }),
            delete: mockDelete,
          };
        }
        if (tabla === 'receta_ingredientes') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: { message: 'FK violation' },
            }),
          };
        }
        return {};
      }),
    };

    const repo = new ProductoRepositorio(supabaseMock as any);
    await expect(
      repo.crear(
        {
          nombre: 'Tarta',
          categoria: 'Tartas',
          unidadVenta: 'Unidad',
          precioLista: 8000,
        },
        [{ materiaPrimaId: 'mp-inexistente', cantidad: 1 }]
      )
    ).rejects.toThrow('Error al guardar ingredientes de la receta: FK violation');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'prod-fallido-1');
  });

  it('debe actualizar los datos de un producto y sincronizar sus ingredientes', async () => {
    const productoActualizadoFila = {
      id: 'prod-1',
      nombre: 'Fideos Caseros Premium',
      categoria: 'Pastas Lisas',
      unidad_venta: 'Porcion',
      precio_lista: 4800,
      stock_actual: 10,
      stock_minimo: 5,
      activo: true,
      receta_ingredientes: [
        {
          id: 'ri-1',
          producto_id: 'prod-1',
          materia_prima_id: 'mp-harina',
          cantidad: 0.25,
          materias_primas: {
            id: 'mp-harina',
            nombre: 'Harina 0000',
            unidad_medida: 'kg',
            costo_unitario: 1200,
          },
        },
      ],
    };

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

    const mockInsertIngredientes = vi.fn().mockResolvedValue({ error: null });

    const supabaseMock = {
      from: vi.fn((tabla: string) => {
        if (tabla === 'productos') {
          return {
            update: mockUpdate,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: productoActualizadoFila,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (tabla === 'receta_ingredientes') {
          return {
            delete: mockDelete,
            insert: mockInsertIngredientes,
          };
        }
        return {};
      }),
    };

    const repo = new ProductoRepositorio(supabaseMock as any);
    const resultado = await repo.actualizar(
      'prod-1',
      {
        nombre: 'Fideos Caseros Premium',
        precioLista: 4800,
      },
      [{ materiaPrimaId: 'mp-harina', cantidad: 0.25 }]
    );

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'prod-1');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('producto_id', 'prod-1');
    expect(mockInsertIngredientes).toHaveBeenCalledWith([
      {
        producto_id: 'prod-1',
        materia_prima_id: 'mp-harina',
        cantidad: 0.25,
      },
    ]);
    expect(resultado.nombre).toBe('Fideos Caseros Premium');
    expect(resultado.precioLista).toBe(4800);
  });
});
