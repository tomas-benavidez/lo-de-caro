import { describe, it, expect, vi } from 'vitest';
import {
  MateriaPrimaRepositorio,
  mapearFilaADominio,
  mapearDominioAFila,
  mapearParcialDominioAFila,
  MateriaPrimaFila,
  NuevaMateriaPrimaInput,
} from '../../src/infrastructure/repositories/materiaPrimaRepositorio.ts';

describe('MateriaPrimaRepositorio & Mapeadores', () => {
  it('mapea correctamente una fila snake_case de Postgres a la entidad de dominio camelCase', () => {
    const filaMock: MateriaPrimaFila = {
      id: 'uuid-1234',
      nombre: 'Harina 0000',
      unidad_medida: 'kg',
      costo_unitario: '1200.50',
      stock_actual: '50',
      stock_minimo: '10',
      created_at: '2026-10-10T12:00:00Z',
      updated_at: '2026-10-10T12:00:00Z',
    };

    const entidad = mapearFilaADominio(filaMock);

    expect(entidad.id).toBe('uuid-1234');
    expect(entidad.nombre).toBe('Harina 0000');
    expect(entidad.unidadMedida).toBe('kg');
    expect(entidad.costoUnitario).toBe(1200.5);
    expect(entidad.stockActual).toBe(50);
    expect(entidad.stockMinimo).toBe(10);
    expect(entidad.fechaCreacion).toBe('2026-10-10T12:00:00Z');
  });

  it('mapea un input del dominio a formato persistible en Postgres', () => {
    const input: NuevaMateriaPrimaInput = {
      nombre: ' Ricotta Magra ',
      unidadMedida: 'g',
      costoUnitario: 4.5,
      stockActual: 2000,
      stockMinimo: 500,
    };

    const fila = mapearDominioAFila(input);

    expect(fila).toEqual({
      nombre: 'Ricotta Magra',
      unidad_medida: 'g',
      costo_unitario: 4.5,
      stock_actual: 2000,
      stock_minimo: 500,
    });
  });

  it('mapea un input parcial del dominio a formato persistible en Postgres', () => {
    const parcial: Partial<NuevaMateriaPrimaInput> = {
      costoUnitario: 1800,
      stockActual: 15,
      unidadMedida: 'kg',
    };

    const fila = mapearParcialDominioAFila(parcial);

    expect(fila).toEqual({
      costo_unitario: 1800,
      stock_actual: 15,
      unidad_medida: 'kg',
    });
  });

  it('debe listar materias primas ordenadas alfabéticamente a través del cliente', async () => {
    const filasMock: MateriaPrimaFila[] = [
      {
        id: '1',
        nombre: 'Espinaca Fresca',
        unidad_medida: 'g',
        costo_unitario: 2.1,
        stock_actual: 800,
        stock_minimo: 1000,
      },
      {
        id: '2',
        nombre: 'Harina 0000',
        unidad_medida: 'g',
        costo_unitario: 1.25,
        stock_actual: 10000,
        stock_minimo: 2000,
      },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: filasMock, error: null }),
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockCliente = {
      from: mockFrom,
    } as any;

    const repo = new MateriaPrimaRepositorio(mockCliente);
    const resultado = await repo.listar();

    expect(mockFrom).toHaveBeenCalledWith('materias_primas');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(resultado).toHaveLength(2);
    expect(resultado[0].nombre).toBe('Espinaca Fresca');
    expect(resultado[1].nombre).toBe('Harina 0000');
  });

  it('debe lanzar error cuando el listado de Supabase falla', async () => {
    const mockCliente = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fallo de red' } }),
        }),
      }),
    } as any;

    const repo = new MateriaPrimaRepositorio(mockCliente);

    await expect(repo.listar()).rejects.toThrow('Error al listar materias primas: Fallo de red');
  });

  it('debe insertar una nueva materia prima y retornar la entidad creada', async () => {
    const filaRetornada: MateriaPrimaFila = {
      id: 'uuid-creado',
      nombre: 'Huevos de Campo',
      unidad_medida: 'u',
      costo_unitario: 150,
      stock_actual: 60,
      stock_minimo: 30,
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: filaRetornada, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

    const mockCliente = {
      from: mockFrom,
    } as any;

    const repo = new MateriaPrimaRepositorio(mockCliente);
    const resultado = await repo.crear({
      nombre: 'Huevos de Campo',
      unidadMedida: 'u',
      costoUnitario: 150,
      stockActual: 60,
      stockMinimo: 30,
    });

    expect(mockFrom).toHaveBeenCalledWith('materias_primas');
    expect(mockInsert).toHaveBeenCalledWith({
      nombre: 'Huevos de Campo',
      unidad_medida: 'u',
      costo_unitario: 150,
      stock_actual: 60,
      stock_minimo: 30,
    });
    expect(resultado.id).toBe('uuid-creado');
    expect(resultado.nombre).toBe('Huevos de Campo');
  });

  it('debe actualizar los campos de una materia prima existente y retornar la entidad', async () => {
    const filaActualizada: MateriaPrimaFila = {
      id: 'uuid-1234',
      nombre: 'Harina 0000',
      unidad_medida: 'kg',
      costo_unitario: 1500,
      stock_actual: 40,
      stock_minimo: 10,
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: filaActualizada, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    const mockCliente = {
      from: mockFrom,
    } as any;

    const repo = new MateriaPrimaRepositorio(mockCliente);
    const resultado = await repo.actualizar('uuid-1234', {
      costoUnitario: 1500,
      stockActual: 40,
    });

    expect(mockFrom).toHaveBeenCalledWith('materias_primas');
    expect(mockUpdate).toHaveBeenCalledWith({
      costo_unitario: 1500,
      stock_actual: 40,
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'uuid-1234');
    expect(resultado.costoUnitario).toBe(1500);
    expect(resultado.stockActual).toBe(40);
  });

  it('debe lanzar error cuando falla la actualización en Supabase', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Fallo al actualizar' } });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    const mockCliente = { from: mockFrom } as any;
    const repo = new MateriaPrimaRepositorio(mockCliente);

    await expect(
      repo.actualizar('uuid-1234', { costoUnitario: 1500 })
    ).rejects.toThrow('Error al actualizar materia prima: Fallo al actualizar');
  });

  it('debe eliminar una materia prima por su id exitosamente', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

    const mockCliente = { from: mockFrom } as any;
    const repo = new MateriaPrimaRepositorio(mockCliente);

    await repo.eliminar('uuid-1234');

    expect(mockFrom).toHaveBeenCalledWith('materias_primas');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'uuid-1234');
  });

  it('debe capturar error Postgres 23503 y lanzar mensaje amigable sobre recetas asociadas', async () => {
    const mockEq = vi.fn().mockResolvedValue({
      error: { code: '23503', message: 'foreign key constraint "receta_ingredientes_materia_prima_id_fkey" violated' },
    });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

    const mockCliente = { from: mockFrom } as any;
    const repo = new MateriaPrimaRepositorio(mockCliente);

    await expect(repo.eliminar('uuid-1234')).rejects.toThrow(
      'No se puede eliminar la materia prima porque está siendo utilizada en una o más recetas.'
    );
  });

  it('debe lanzar error genérico cuando falla la eliminación por otro motivo', async () => {
    const mockEq = vi.fn().mockResolvedValue({
      error: { code: '42P01', message: 'relation does not exist' },
    });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

    const mockCliente = { from: mockFrom } as any;
    const repo = new MateriaPrimaRepositorio(mockCliente);

    await expect(repo.eliminar('uuid-1234')).rejects.toThrow(
      'Error al eliminar materia prima: relation does not exist'
    );
  });
});
