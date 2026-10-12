import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConfiguracionRepositorio,
  CLAVE_STORAGE_GASTO_FIJO,
} from '../../src/infrastructure/repositories/configuracionRepositorio.ts';

describe('ConfiguracionRepositorio', () => {
  let repo: ConfiguracionRepositorio;
  let almacenamiento: Record<string, string>;

  beforeEach(() => {
    almacenamiento = {};
    repo = new ConfiguracionRepositorio();

    // Mock seguro de localStorage en entorno de pruebas
    const mockLocalStorage = {
      getItem: vi.fn((clave: string) => almacenamiento[clave] ?? null),
      setItem: vi.fn((clave: string, valor: string) => {
        almacenamiento[clave] = valor;
      }),
      removeItem: vi.fn((clave: string) => {
        delete almacenamiento[clave];
      }),
      clear: vi.fn(() => {
        almacenamiento = {};
      }),
    };

    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('debe retornar 0 por defecto si no hay valor guardado en storage', () => {
    expect(repo.obtenerGastoFijoPorcion()).toBe(0);
  });

  it('debe guardar y recuperar correctamente el gasto fijo por porción', () => {
    const guardado = repo.guardarGastoFijoPorcion(500);
    expect(guardado).toBe(500);
    expect(localStorage.setItem).toHaveBeenCalledWith(CLAVE_STORAGE_GASTO_FIJO, '500');

    const recuperado = repo.obtenerGastoFijoPorcion();
    expect(recuperado).toBe(500);
  });

  it('debe redondear el monto a 2 decimales y no permitir valores negativos', () => {
    const guardadoDecimal = repo.guardarGastoFijoPorcion(350.556);
    expect(guardadoDecimal).toBe(350.56);
    expect(repo.obtenerGastoFijoPorcion()).toBe(350.56);

    const guardadoNegativo = repo.guardarGastoFijoPorcion(-100);
    expect(guardadoNegativo).toBe(0);
    expect(repo.obtenerGastoFijoPorcion()).toBe(0);
  });

  it('debe retornar 0 si el valor en storage no es un número válido', () => {
    almacenamiento[CLAVE_STORAGE_GASTO_FIJO] = 'invalido';
    expect(repo.obtenerGastoFijoPorcion()).toBe(0);
  });

  it('debe responder con 0 y no arrojar error si localStorage lanza una excepción', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('Storage bloqueado');
      }),
      setItem: vi.fn(() => {
        throw new Error('Storage bloqueado');
      }),
    });

    expect(repo.obtenerGastoFijoPorcion()).toBe(0);
    expect(() => repo.guardarGastoFijoPorcion(200)).not.toThrow();
  });

  describe('Meta Mensual', () => {
    it('debe retornar 300000 por defecto si no hay meta configurada', () => {
      expect(repo.obtenerMetaMensual()).toBe(300000);
      expect(repo.obtenerMetaMensual('2026-10')).toBe(300000);
    });

    it('debe guardar y recuperar la meta general por defecto', () => {
      const guardado = repo.guardarMetaMensual(450000);
      expect(guardado).toBe(450000);
      expect(repo.obtenerMetaMensual()).toBe(450000);
      // Para un mes sin meta específica, hereda la meta general
      expect(repo.obtenerMetaMensual('2026-11')).toBe(450000);
    });

    it('debe guardar y recuperar meta específica para un mes determinado', () => {
      repo.guardarMetaMensual(350000, '2026-10');
      repo.guardarMetaMensual(500000, '2026-11');

      expect(repo.obtenerMetaMensual('2026-10')).toBe(350000);
      expect(repo.obtenerMetaMensual('2026-11')).toBe(500000);
      // Otro mes no configurado debe retornar la meta general
      expect(repo.obtenerMetaMensual('2026-12')).toBe(300000);
    });

    it('debe sanitizar montos negativos o inválidos a 0', () => {
      repo.guardarMetaMensual(-5000, '2026-10');
      expect(repo.obtenerMetaMensual('2026-10')).toBe(0);
    });

    it('debe tolerar fallos en localStorage sin arrojar excepciones', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => {
          throw new Error('Storage bloqueado');
        }),
        setItem: vi.fn(() => {
          throw new Error('Storage bloqueado');
        }),
      });

      expect(repo.obtenerMetaMensual('2026-10')).toBe(300000);
      expect(() => repo.guardarMetaMensual(400000, '2026-10')).not.toThrow();
    });

    it('debe protegerse contra valores corruptos, arrays o NaN en storage', () => {
      // Si el storage tiene un array en lugar de un objeto
      almacenamiento['lo_de_caro_metas_por_mes'] = JSON.stringify(['invalido']);
      expect(repo.obtenerMetasPorMes()).toEqual({});

      // Si el storage tiene NaN o no numéricos para un mes
      almacenamiento['lo_de_caro_metas_por_mes'] = JSON.stringify({
        '2026-10': null,
        '2026-11': 'no-numero',
      });
      expect(repo.obtenerMetaMensual('2026-10')).toBe(300000);
      expect(repo.obtenerMetaMensual('2026-11')).toBe(300000);
    });
  });
});

