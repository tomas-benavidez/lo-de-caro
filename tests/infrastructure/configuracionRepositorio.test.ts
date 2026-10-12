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
});
