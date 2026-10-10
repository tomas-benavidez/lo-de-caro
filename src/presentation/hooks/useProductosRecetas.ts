import { useState, useEffect, useCallback } from 'react';
import { Producto } from '../../domain/models/producto.ts';
import {
  ProductoRepositorio,
  productoRepositorio as repositorioPorDefecto,
  NuevoProductoInput,
  NuevoIngredienteRecetaInput,
} from '../../infrastructure/repositories/productoRepositorio.ts';

export interface UseProductosRecetasResultado {
  productos: Producto[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  crearProductoReceta: (
    producto: NuevoProductoInput,
    ingredientes: NuevoIngredienteRecetaInput[]
  ) => Promise<Producto>;
  actualizarProductoReceta: (
    id: string,
    producto: Partial<NuevoProductoInput>,
    ingredientes?: NuevoIngredienteRecetaInput[]
  ) => Promise<Producto>;
  eliminarProductoReceta: (id: string) => Promise<void>;
}

/**
 * Hook de aplicación para gestionar el ciclo de vida, recetas y mutaciones de productos.
 */
export function useProductosRecetas(
  repositorio: ProductoRepositorio = repositorioPorDefecto
): UseProductosRecetasResultado {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await repositorio.listar();
      setProductos(datos);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido al cargar recetas y productos';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [repositorio]);

  const crearProductoReceta = useCallback(
    async (
      producto: NuevoProductoInput,
      ingredientes: NuevoIngredienteRecetaInput[]
    ): Promise<Producto> => {
      setError(null);
      try {
        const nuevo = await repositorio.crear(producto, ingredientes);
        setProductos((previos) => {
          const actualizados = [...previos, nuevo];
          return actualizados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        });
        return nuevo;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al crear la receta del producto';
        setError(mensaje);
        throw err;
      }
    },
    [repositorio]
  );

  const actualizarProductoReceta = useCallback(
    async (
      id: string,
      producto: Partial<NuevoProductoInput>,
      ingredientes?: NuevoIngredienteRecetaInput[]
    ): Promise<Producto> => {
      setError(null);
      try {
        const actualizado = await repositorio.actualizar(id, producto, ingredientes);
        setProductos((previos) => {
          const actualizados = previos.map((item) => (item.id === id ? actualizado : item));
          return actualizados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        });
        return actualizado;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al actualizar la receta del producto';
        setError(mensaje);
        throw err;
      }
    },
    [repositorio]
  );

  const eliminarProductoReceta = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        await repositorio.eliminar(id);
        setProductos((previos) => previos.filter((item) => item.id !== id));
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al eliminar el producto';
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
    productos,
    cargando,
    error,
    recargar,
    crearProductoReceta,
    actualizarProductoReceta,
    eliminarProductoReceta,
  };
}
