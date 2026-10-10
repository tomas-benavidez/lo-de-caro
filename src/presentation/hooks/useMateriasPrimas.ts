import { useState, useEffect, useCallback } from 'react';
import { MateriaPrima } from '../../domain/models/materiaPrima.ts';
import {
  MateriaPrimaRepositorio,
  materiaPrimaRepositorio as repositorioPorDefecto,
  NuevaMateriaPrimaInput,
} from '../../infrastructure/repositories/materiaPrimaRepositorio.ts';

export interface UseMateriasPrimasResultado {
  materiasPrimas: MateriaPrima[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  crearMateriaPrima: (datos: NuevaMateriaPrimaInput) => Promise<MateriaPrima>;
  actualizarMateriaPrima: (id: string, datos: Partial<NuevaMateriaPrimaInput>) => Promise<MateriaPrima>;
  eliminarMateriaPrima: (id: string) => Promise<void>;
}

/**
 * Hook de aplicación para gestionar el ciclo de vida y mutaciones de las materias primas.
 */
export function useMateriasPrimas(
  repositorio: MateriaPrimaRepositorio = repositorioPorDefecto
): UseMateriasPrimasResultado {
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await repositorio.listar();
      setMateriasPrimas(datos);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido al cargar materias primas';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [repositorio]);

  const crearMateriaPrima = useCallback(
    async (datos: NuevaMateriaPrimaInput): Promise<MateriaPrima> => {
      setError(null);
      try {
        const nueva = await repositorio.crear(datos);
        setMateriasPrimas((previas) => {
          const actualizadas = [...previas, nueva];
          return actualizadas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        });
        return nueva;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al crear materia prima';
        setError(mensaje);
        throw err;
      }
    },
    [repositorio]
  );

  const actualizarMateriaPrima = useCallback(
    async (id: string, datos: Partial<NuevaMateriaPrimaInput>): Promise<MateriaPrima> => {
      setError(null);
      try {
        const actualizada = await repositorio.actualizar(id, datos);
        setMateriasPrimas((previas) => {
          const actualizadas = previas.map((item) => (item.id === id ? actualizada : item));
          return actualizadas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        });
        return actualizada;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al actualizar materia prima';
        setError(mensaje);
        throw err;
      }
    },
    [repositorio]
  );

  const eliminarMateriaPrima = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        await repositorio.eliminar(id);
        setMateriasPrimas((previas) => previas.filter((item) => item.id !== id));
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al eliminar materia prima';
        setError(mensaje);
        throw err;
      }
    },
    [repositorio]
  );

  useEffect(() => {
    recargar();
  }, [recargar]);

  return {
    materiasPrimas,
    cargando,
    error,
    recargar,
    crearMateriaPrima,
    actualizarMateriaPrima,
    eliminarMateriaPrima,
  };
}
