import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GastoRepositorio,
  mapearFilaAGasto,
  GastoFila,
  obtenerMetadatosGasto,
  guardarMetadatosGasto,
  codificarConceptoConMetadatos,
  decodificarConceptoYMetadatos,
} from '../../src/infrastructure/repositories/gastoRepositorio.ts';
import { NuevoGastoInput } from '../../src/domain/models/gasto.ts';

describe('GastoRepositorio & Mapeadores', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('codificarConceptoConMetadatos & decodificarConceptoYMetadatos', () => {
    it('codifica y decodifica correctamente método de pago y detalle de compra', () => {
      const conceptoBase = 'Compra 25kg Harina 0000 Molino';
      const metadatos = {
        metodoPago: 'Transferencia' as const,
        compraMateriaPrima: {
          materiaPrimaId: 'mp-1',
          nombreMateriaPrima: 'Harina 0000',
          cantidadComprada: 25,
          unidadMedida: 'kg' as const,
          actualizarCostoUnitario: true,
          nuevoCostoUnitario: 1000,
        },
        costoPrevio: 800,
      };

      const codificado = codificarConceptoConMetadatos(conceptoBase, metadatos);
      expect(codificado).toContain('Compra 25kg Harina 0000 Molino <!--meta:');
      expect(codificado.length).toBeLessThanOrEqual(200);

      const decodificado = decodificarConceptoYMetadatos(codificado);
      expect(decodificado.concepto).toBe(conceptoBase);
      expect(decodificado.metadatos).not.toBeNull();
      expect(decodificado.metadatos?.metodoPago).toBe('Transferencia');
      expect(decodificado.metadatos?.compraMateriaPrima?.materiaPrimaId).toBe('mp-1');
      expect(decodificado.metadatos?.compraMateriaPrima?.cantidadComprada).toBe(25);
      expect(decodificado.metadatos?.compraMateriaPrima?.nuevoCostoUnitario).toBe(1000);
      expect(decodificado.metadatos?.costoPrevio).toBe(800);
    });

    it('retorna metadatos null si el concepto no contiene etiqueta de metadatos', () => {
      const decodificado = decodificarConceptoYMetadatos('Pago Factura Luz Edenor');
      expect(decodificado.concepto).toBe('Pago Factura Luz Edenor');
      expect(decodificado.metadatos).toBeNull();
    });
  });

  describe('mapearFilaAGasto', () => {
    it('mapea correctamente una fila snake_case de Postgres a la entidad de dominio', () => {
      const fila: GastoFila = {
        id: 'g-100',
        fecha: '2026-10-10',
        concepto: 'Garrafa 10kg',
        categoria: 'Servicios',
        monto: 15000,
        created_at: '2026-10-10T12:00:00Z',
      };

      const gasto = mapearFilaAGasto(fila);

      expect(gasto.id).toBe('g-100');
      expect(gasto.fecha).toBe('2026-10-10');
      expect(gasto.concepto).toBe('Garrafa 10kg');
      expect(gasto.categoria).toBe('Servicios');
      expect(gasto.monto).toBe(15000);
      expect(gasto.metodoPago).toBe('Efectivo'); // Default
      expect(gasto.compraMateriaPrima).toBeUndefined();
    });

    it('recupera método de pago y detalle de compra directamente desde el concepto sin localStorage', () => {
      // Simular que el usuario abrió la app en otro dispositivo o vació la memoria
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }

      const fila: GastoFila = {
        id: 'g-resiliente',
        fecha: '2026-10-11',
        concepto:
          'Compra Harina 0000 <!--meta:{"m":"T","id":"mp-1","c":25,"u":"kg","nc":1000,"cp":800}-->',
        categoria: 'Materia Prima',
        monto: 25000,
        created_at: '2026-10-11T12:00:00Z',
      };

      const gasto = mapearFilaAGasto(fila);

      // El concepto queda limpio sin la etiqueta oculta
      expect(gasto.concepto).toBe('Compra Harina 0000');
      expect(gasto.metodoPago).toBe('Transferencia');
      expect(gasto.compraMateriaPrima).toBeDefined();
      expect(gasto.compraMateriaPrima?.materiaPrimaId).toBe('mp-1');
      expect(gasto.compraMateriaPrima?.cantidadComprada).toBe(25);
      expect(gasto.compraMateriaPrima?.nuevoCostoUnitario).toBe(1000);
    });

    it('asocia método de pago y detalle de compra de materia prima desde metadatos locales como fallback', () => {
      const fila: GastoFila = {
        id: 'g-101',
        fecha: '2026-10-10',
        concepto: 'Compra Harina 0000',
        categoria: 'Materia Prima',
        monto: 25000,
        created_at: '2026-10-10T12:00:00Z',
      };

      guardarMetadatosGasto('g-101', {
        metodoPago: 'Transferencia',
        compraMateriaPrima: {
          materiaPrimaId: 'mp-1',
          nombreMateriaPrima: 'Harina 0000',
          cantidadComprada: 25,
          unidadMedida: 'kg',
          actualizarCostoUnitario: true,
          nuevoCostoUnitario: 1000,
        },
      });

      const gasto = mapearFilaAGasto(fila);

      expect(gasto.metodoPago).toBe('Transferencia');
      expect(gasto.compraMateriaPrima).toBeDefined();
      expect(gasto.compraMateriaPrima?.materiaPrimaId).toBe('mp-1');
      expect(gasto.compraMateriaPrima?.cantidadComprada).toBe(25);
      expect(gasto.compraMateriaPrima?.nuevoCostoUnitario).toBe(1000);
    });
  });

  describe('Métodos del Repositorio con Mock de Supabase', () => {
    let mockSupabase: any;
    let repo: GastoRepositorio;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn(),
      };
      repo = new GastoRepositorio(mockSupabase);
    });

    it('debe listar gastos ordenados por fecha y created_at descendente', async () => {
      const filasMock: GastoFila[] = [
        {
          id: 'g-1',
          fecha: '2026-10-11',
          concepto: 'Cajas',
          categoria: 'Packaging',
          monto: 30000,
          created_at: '2026-10-11T10:00:00Z',
        },
      ];

      const order2 = vi.fn().mockResolvedValue({ data: filasMock, error: null });
      const order1 = vi.fn().mockReturnValue({ order: order2 });
      const select = vi.fn().mockReturnValue({ order: order1 });

      mockSupabase.from.mockReturnValue({ select });

      const gastos = await repo.listar();

      expect(mockSupabase.from).toHaveBeenCalledWith('gastos');
      expect(select).toHaveBeenCalledWith('*');
      expect(order1).toHaveBeenCalledWith('fecha', { ascending: false });
      expect(order2).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(gastos).toHaveLength(1);
      expect(gastos[0].id).toBe('g-1');
    });

    it('debe lanzar error cuando falla la consulta de listar en Supabase', async () => {
      const order2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'Falla de red' } });
      const order1 = vi.fn().mockReturnValue({ order: order2 });
      const select = vi.fn().mockReturnValue({ order: order1 });

      mockSupabase.from.mockReturnValue({ select });

      await expect(repo.listar()).rejects.toThrow('Error al listar gastos');
    });

    it('debe registrar un gasto operativo estándar codificando metadatos', async () => {
      const input: NuevoGastoInput = {
        concepto: 'Factura Luz',
        categoria: 'Servicios',
        monto: 18500,
        metodoPago: 'Transferencia',
        fecha: '2026-10-11',
      };

      const filaInsertada: GastoFila = {
        id: 'g-200',
        fecha: '2026-10-11',
        concepto: 'Factura Luz <!--meta:{"m":"T"}-->',
        categoria: 'Servicios',
        monto: 18500,
        created_at: '2026-10-11T11:00:00Z',
      };

      const single = vi.fn().mockResolvedValue({ data: filaInsertada, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });

      mockSupabase.from.mockReturnValue({ insert });

      const resultado = await repo.registrarGasto(input);

      expect(mockSupabase.from).toHaveBeenCalledWith('gastos');
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          fecha: '2026-10-11',
          categoria: 'Servicios',
          monto: 18500,
        })
      );
      expect(resultado.id).toBe('g-200');
      expect(resultado.concepto).toBe('Factura Luz');
      expect(resultado.metodoPago).toBe('Transferencia');
    });

    it('debe registrar un gasto de Materia Prima consultando stock en DB y actualizando stock y costo unitario', async () => {
      const materiaPrimaDb = {
        id: 'mp-1',
        nombre: 'Harina 0000',
        unidad_medida: 'kg',
        costo_unitario: 800,
        stock_actual: 10,
      };

      const input: NuevoGastoInput = {
        concepto: 'Compra 25kg Harina',
        categoria: 'Materia Prima',
        monto: 25000,
        metodoPago: 'Efectivo',
        fecha: '2026-10-11',
        compraMateriaPrima: {
          materiaPrimaId: 'mp-1',
          cantidadComprada: 25,
          actualizarCostoUnitario: true,
        },
      };

      const filaInsertada: GastoFila = {
        id: 'g-300',
        fecha: '2026-10-11',
        concepto: 'Compra 25kg Harina <!--meta:{"m":"E","id":"mp-1","c":25,"u":"kg","nc":1000}-->',
        categoria: 'Materia Prima',
        monto: 25000,
        created_at: '2026-10-11T12:00:00Z',
      };

      // Mock para select en materias_primas
      const singleMp = vi.fn().mockResolvedValue({ data: materiaPrimaDb, error: null });
      const eqMp = vi.fn().mockReturnValue({ single: singleMp });
      const selectMp = vi.fn().mockReturnValue({ eq: eqMp });

      // Mock para update en materias_primas
      const eqUpdateMp = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateMp = vi.fn().mockReturnValue({ eq: eqUpdateMp });

      // Mock para insert en gastos
      const singleGasto = vi.fn().mockResolvedValue({ data: filaInsertada, error: null });
      const selectGasto = vi.fn().mockReturnValue({ single: singleGasto });
      const insertGasto = vi.fn().mockReturnValue({ select: selectGasto });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'gastos') {
          return { insert: insertGasto };
        }
        if (tabla === 'materias_primas') {
          return { select: selectMp, update: updateMp };
        }
        return {};
      });

      const resultado = await repo.registrarGasto(input);

      expect(resultado.id).toBe('g-300');
      expect(resultado.concepto).toBe('Compra 25kg Harina');
      expect(resultado.compraMateriaPrima).toBeDefined();
      expect(resultado.compraMateriaPrima?.cantidadComprada).toBe(25);
      expect(resultado.compraMateriaPrima?.nuevoCostoUnitario).toBe(1000); // 25000 / 25

      // Verificar que se actualizó materias_primas con nuevo stock (10 + 25 = 35) y nuevo costo (1000)
      expect(updateMp).toHaveBeenCalledWith({
        stock_actual: 35,
        costo_unitario: 1000,
      });
      expect(eqUpdateMp).toHaveBeenCalledWith('id', 'mp-1');
    });

    it('debe ejecutar rollback defensivo si falla la actualización de materia prima', async () => {
      const materiaPrimaDb = {
        id: 'mp-1',
        nombre: 'Harina 0000',
        unidad_medida: 'kg',
        costo_unitario: 800,
        stock_actual: 10,
      };

      const input: NuevoGastoInput = {
        concepto: 'Compra 25kg Harina',
        categoria: 'Materia Prima',
        monto: 25000,
        metodoPago: 'Efectivo',
        compraMateriaPrima: {
          materiaPrimaId: 'mp-1',
          cantidadComprada: 25,
          actualizarCostoUnitario: true,
        },
      };

      const filaInsertada: GastoFila = {
        id: 'g-fail',
        fecha: '2026-10-11',
        concepto: 'Compra 25kg Harina',
        categoria: 'Materia Prima',
        monto: 25000,
      };

      // Select de materias_primas
      const singleMp = vi.fn().mockResolvedValue({ data: materiaPrimaDb, error: null });
      const eqMp = vi.fn().mockReturnValue({ single: singleMp });
      const selectMp = vi.fn().mockReturnValue({ eq: eqMp });

      // Update falla en materias_primas
      const eqUpdateMp = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });
      const updateMp = vi.fn().mockReturnValue({ eq: eqUpdateMp });

      // Insert en gastos
      const singleGasto = vi.fn().mockResolvedValue({ data: filaInsertada, error: null });
      const selectGasto = vi.fn().mockReturnValue({ single: singleGasto });
      const insertGasto = vi.fn().mockReturnValue({ select: selectGasto });

      // Delete para rollback en gastos
      const eqDelete = vi.fn().mockResolvedValue({ data: null, error: null });
      const deleteGasto = vi.fn().mockReturnValue({ eq: eqDelete });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'gastos') {
          return { insert: insertGasto, delete: deleteGasto };
        }
        if (tabla === 'materias_primas') {
          return { select: selectMp, update: updateMp };
        }
        return {};
      });

      await expect(repo.registrarGasto(input)).rejects.toThrow(
        'Error al actualizar el stock de materia prima. Se revirtió el registro del gasto.'
      );

      // Verificar que se llamó al delete defensivo
      expect(deleteGasto).toHaveBeenCalled();
      expect(eqDelete).toHaveBeenCalledWith('id', 'g-fail');
    });

    it('debe eliminar un gasto y restituir el stock si tenía compra de materia prima', async () => {
      const materiaPrimaDb = {
        id: 'mp-1',
        nombre: 'Harina 0000',
        stock_actual: 35,
        costo_unitario: 1000,
      };

      guardarMetadatosGasto('g-delete', {
        metodoPago: 'Efectivo',
        compraMateriaPrima: {
          materiaPrimaId: 'mp-1',
          nombreMateriaPrima: 'Harina 0000',
          cantidadComprada: 25,
          unidadMedida: 'kg',
          actualizarCostoUnitario: true,
          nuevoCostoUnitario: 1000,
        },
      });

      // Select de materias_primas para leer stock actual
      const singleMp = vi.fn().mockResolvedValue({ data: materiaPrimaDb, error: null });
      const eqMp = vi.fn().mockReturnValue({ single: singleMp });
      const selectMp = vi.fn().mockReturnValue({ eq: eqMp });

      // Update de materias_primas
      const eqUpdateMp = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateMp = vi.fn().mockReturnValue({ eq: eqUpdateMp });

      // Delete de gastos
      const eqDelete = vi.fn().mockResolvedValue({ data: null, error: null });
      const deleteGasto = vi.fn().mockReturnValue({ eq: eqDelete });

      mockSupabase.from.mockImplementation((tabla: string) => {
        if (tabla === 'gastos') {
          return { delete: deleteGasto };
        }
        if (tabla === 'materias_primas') {
          return { select: selectMp, update: updateMp };
        }
        return {};
      });

      await repo.eliminarGasto('g-delete');

      // Debe restituir el stock restando 25 (35 - 25 = 10)
      expect(updateMp).toHaveBeenCalledWith(expect.objectContaining({ stock_actual: 10 }));
      expect(eqUpdateMp).toHaveBeenCalledWith('id', 'mp-1');

      // Debe eliminar el gasto de la tabla
      expect(deleteGasto).toHaveBeenCalled();
      expect(eqDelete).toHaveBeenCalledWith('id', 'g-delete');

      // Metadatos deben haberse limpiado
      expect(obtenerMetadatosGasto('g-delete')).toBeNull();
    });
  });
});
