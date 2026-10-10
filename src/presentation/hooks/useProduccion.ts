import { useState, useEffect, useCallback } from 'react';
import { LoteProduccion } from '../../domain/models/loteProduccion.ts';
import { RecetaIngredienteItem } from '../../domain/models/producto.ts';
import {
  LoteProduccionRepositorio,
  loteProduccionRepositorio as repositorioPorDefecto,
  NuevoLoteProduccionInput,
} from '../../infrastructure/repositories/loteProduccionRepositorio.ts';

export interface UseProduccionResultado {
  lotes: LoteProduccion[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  registrarProduccion: (
    input: NuevoLoteProduccionInput,
    ingredientes: RecetaIngredienteItem[]
  ) => Promise<LoteProduccion>;
  eliminarLote: (id: string) => Promise<void>;
}

/**
 * Hook de aplicación para gestionar los lotes de producción elaborados y sincronización de stock.
 */
export function useProduccion(
  repositorio: LoteProduccionRepositorio = repositorioPorDefecto
): UseProduccionResultado {
  const [lotes, setLotes] = useState<LoteProduccion[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await repositorio.listarLotes();
      setLotes(datos);
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error desconocido al cargar lotes de producción.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [repositorio]);

  const registrarProduccion = useCallback(
    async (
      input: NuevoLoteProduccionInput,
      ingredientes: RecetaIngredienteItem[]
    ): Promise<LoteProduccion> => {
      setError(null);
      try {
        const nuevoLote = await repositorio.registrarProduccion(input, ingredientes);
        setLotes((previos) => [nuevoLote, ...previos]);
        return nuevoLote;
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al registrar lote de producción.';
        setError(mensaje);
        throw err;
      }
    },
    [repositorio]
  );

  const eliminarLote = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        await repositorio.eliminarLote(id);
        setLotes((previos) => previos.filter((item) => item.id !== id));
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al eliminar lote de producción.';
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
    lotes,
    cargando,
    error,
    recargar,
    registrarProduccion,
    eliminarLote,
  };
}
