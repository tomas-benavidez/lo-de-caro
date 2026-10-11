import { useState, useEffect, useCallback, useMemo } from 'react';
import { Gasto, NuevoGastoInput, ResumenGastos } from '../../domain/models/gasto.ts';
import { MateriaPrima } from '../../domain/models/materiaPrima.ts';
import { calcularResumenGastos } from '../../domain/services/gastoServicio.ts';
import {
  GastoRepositorio,
  gastoRepositorio as gastoRepoDefault,
} from '../../infrastructure/repositories/gastoRepositorio.ts';

export interface UseGastosResultado {
  gastos: Gasto[];
  resumen: ResumenGastos;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  registrarGasto: (input: NuevoGastoInput, materiaPrima?: MateriaPrima) => Promise<Gasto>;
  eliminarGasto: (id: string, materiaPrima?: MateriaPrima) => Promise<void>;
}

/**
 * Hook de aplicación para orquestar el libro diario de gastos y compras operativas.
 */
export function useGastos(
  gastoRepo: GastoRepositorio = gastoRepoDefault
): UseGastosResultado {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await gastoRepo.listar();
      setGastos(datos);
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al cargar el libro diario de gastos.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [gastoRepo]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const resumen = useMemo(() => {
    return calcularResumenGastos(gastos);
  }, [gastos]);

  const registrarGasto = useCallback(
    async (input: NuevoGastoInput, materiaPrima?: MateriaPrima): Promise<Gasto> => {
      setError(null);
      try {
        const nuevoGasto = await gastoRepo.registrarGasto(input, materiaPrima);
        setGastos((prev) => [nuevoGasto, ...prev]);
        return nuevoGasto;
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al registrar el gasto.';
        setError(mensaje);
        throw err;
      }
    },
    [gastoRepo]
  );

  const eliminarGasto = useCallback(
    async (id: string, materiaPrima?: MateriaPrima): Promise<void> => {
      setError(null);
      try {
        await gastoRepo.eliminarGasto(id, materiaPrima);
        setGastos((prev) => prev.filter((g) => g.id !== id));
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al eliminar el gasto.';
        setError(mensaje);
        throw err;
      }
    },
    [gastoRepo]
  );

  return {
    gastos,
    resumen,
    cargando,
    error,
    recargar,
    registrarGasto,
    eliminarGasto,
  };
}
