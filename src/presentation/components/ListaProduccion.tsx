import React, { useState, useMemo } from 'react';
import { LoteProduccion } from '../../domain/models/loteProduccion.ts';
import { Producto } from '../../domain/models/producto.ts';
import { clasificarStockCongelado } from '../../domain/services/produccionServicio.ts';
import { Boton } from './Boton.tsx';

export interface ListaProduccionProps {
  lotes: LoteProduccion[];
  productos: Producto[];
  cargando: boolean;
  error: string | null;
  onAbrirNuevoModal: () => void;
  onCocinarProducto?: (productoId: string) => void;
  onAjustarStock?: (producto: Producto) => void;
  onEliminarLote?: (lote: LoteProduccion) => void;
  onReintentar?: () => void;
}

/**
 * Formatea una fecha ISO o YYYY-MM-DD a formato amigable argentino (DD/MM/YYYY).
 */
function formatearFecha(fechaStr: string): string {
  if (!fechaStr) return '';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaStr;
}

/**
 * Componente mobile-first para la visualización de stock de freezer e historial de tandas cocinadas.
 */
export const ListaProduccion: React.FC<ListaProduccionProps> = ({
  lotes,
  productos,
  cargando,
  error,
  onAbrirNuevoModal,
  onCocinarProducto,
  onAjustarStock,
  onEliminarLote,
  onReintentar,
}) => {

  const [vistaActiva, setVistaActiva] = useState<'freezer' | 'historial'>('freezer');
  const [filtroStock, setFiltroStock] = useState<'todos' | 'reponer' | 'ok'>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Filtro de productos en el freezer
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideBusqueda =
        !busqueda.trim() ||
        p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) ||
        p.categoria.toLowerCase().includes(busqueda.trim().toLowerCase());

      const estado = clasificarStockCongelado(p.stockActual, p.stockMinimo);
      const coincideEstado =
        filtroStock === 'todos' ||
        (filtroStock === 'reponer' && (estado === 'SIN_STOCK' || estado === 'REPONER')) ||
        (filtroStock === 'ok' && estado === 'SALUDABLE');

      return coincideBusqueda && coincideEstado;
    });
  }, [productos, busqueda, filtroStock]);

  // Filtro de lotes históricos
  const lotesFiltrados = useMemo(() => {
    return lotes.filter((l) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.trim().toLowerCase();
      return (
        l.nombreProducto.toLowerCase().includes(q) ||
        (l.observaciones && l.observaciones.toLowerCase().includes(q)) ||
        l.fecha.includes(q)
      );
    });
  }, [lotes, busqueda]);

  // Contadores para badges del freezer
  const resumenFreezer = useMemo(() => {
    let sinStock = 0;
    let reponer = 0;
    let saludables = 0;
    for (const p of productos) {
      const estado = clasificarStockCongelado(p.stockActual, p.stockMinimo);
      if (estado === 'SIN_STOCK') sinStock++;
      else if (estado === 'REPONER') reponer++;
      else saludables++;
    }
    return { sinStock, reponer, saludables, totalCriticos: sinStock + reponer };
  }, [productos]);

  if (cargando) {
    return (
      <div className="space-y-3 py-6" role="status" aria-label="Cargando datos de producción">
        <div className="h-10 bg-stone-200 animate-pulse rounded-lg" />
        <div className="h-24 bg-stone-200 animate-pulse rounded-lg" />
        <div className="h-24 bg-stone-200 animate-pulse rounded-lg" />
        <span className="sr-only">Cargando datos de producción y freezer...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-marca-tomate/30 rounded-xl text-stone-900 space-y-3 my-4"
      >
        <p className="font-semibold text-marca-tomate text-sm">Error al cargar producción</p>
        <p className="text-xs text-stone-700">{error}</p>
        {onReintentar && (
          <Boton variante="secundario" tamano="chico" onClick={onReintentar}>
            Reintentar
          </Boton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Encabezado y Acción Principal */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-stone-900">Producción y Freezer</h2>
          <p className="text-xs text-stone-500">
            Control de comidas congeladas listas y registro de cocción
          </p>
        </div>
        <Boton
          variante="primario"
          tamano="chico"
          onClick={onAbrirNuevoModal}
          className="whitespace-nowrap"
          aria-label="Registrar nueva tanda de cocina"
        >
          Agregar
        </Boton>
      </div>

      {/* Selector de sub-sección: Freezer vs Historial */}
      <div className="flex border-b border-stone-200 bg-white rounded-lg p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setVistaActiva('freezer')}
          aria-label={`Stock de Congelados (${productos.length} productos${
            resumenFreezer.totalCriticos > 0 ? `, ${resumenFreezer.totalCriticos} para reponer` : ''
          })`}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed ${
            vistaActiva === 'freezer'
              ? 'bg-marca-canela text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 active:bg-stone-100'
          }`}
        >
          Stock de Congelados ({productos.length})
          {resumenFreezer.totalCriticos > 0 && (
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                vistaActiva === 'freezer'
                  ? 'bg-white text-marca-canela'
                  : 'bg-marca-tomate text-white'
              }`}
            >
              {resumenFreezer.totalCriticos}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setVistaActiva('historial')}
          aria-label={`Historial de Producción (${lotes.length} tandas elaboradas)`}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed ${
            vistaActiva === 'historial'
              ? 'bg-marca-canela text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 active:bg-stone-100'
          }`}
        >
          Historial de Producción ({lotes.length})
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <label htmlFor="buscador-produccion" className="sr-only">
            Buscar productos en freezer o historial de producción
          </label>
          <input
            id="buscador-produccion"
            name="buscador-produccion"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={
              vistaActiva === 'freezer'
                ? 'Buscar producto en freezer...'
                : 'Buscar por plato, fecha o nota...'
            }
            className="w-full pl-3 pr-8 py-2 text-xs bg-white text-stone-900 border border-stone-300 rounded-lg shadow-sm placeholder:text-stone-400 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 active:text-stone-800 text-xs p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {vistaActiva === 'freezer' && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'todos', label: 'Todos' },
              {
                id: 'reponer',
                label: `Falta cocinar (${resumenFreezer.totalCriticos})`,
              },
              {
                id: 'ok',
                label: `Stock OK (${resumenFreezer.saludables})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroStock(f.id as typeof filtroStock)}
                className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed ${
                  filtroStock === f.id
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 active:bg-stone-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VISTA 1: STOCK DE CONGELADOS */}
      {vistaActiva === 'freezer' && (
        <section className="space-y-3" aria-label="Listado de productos congelados">
          {productosFiltrados.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-stone-500 space-y-2">
              <p className="text-sm font-semibold text-stone-700">No se encontraron productos</p>
              <p className="text-xs text-stone-400">
                {busqueda
                  ? 'No hay productos que coincidan con la búsqueda.'
                  : 'Creá tus recetas en la solapa "Recetas" para controlar su stock de freezer.'}
              </p>
            </div>
          ) : (
            productosFiltrados.map((prod) => {
              const estado = clasificarStockCongelado(prod.stockActual, prod.stockMinimo);
              const esSinStock = estado === 'SIN_STOCK';
              const esReponer = estado === 'REPONER';

              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-xl border transition-all duration-150 p-3.5 shadow-xs ${
                    esSinStock
                      ? 'border-marca-tomate/40 bg-red-50/20'
                      : esReponer
                      ? 'border-marca-otono/40 bg-orange-50/20'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-stone-900 truncate">
                          {prod.nombre}
                        </h3>
                        <span className="text-[10px] font-medium text-stone-500 px-1.5 py-0.5 bg-stone-100 rounded">
                          {prod.categoria}
                        </span>
                      </div>

                      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-extrabold text-stone-900 tracking-tight">
                          {prod.stockActual}{' '}
                          <span className="text-xs font-semibold text-stone-500 font-normal">
                            {prod.unidadVenta}
                          </span>
                        </span>
                        <span className="text-xs text-stone-400">
                          (mínimo sugerido: {prod.stockMinimo} {prod.unidadVenta})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {esSinStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-marca-tomate text-white shadow-xs">
                          SIN STOCK
                        </span>
                      ) : esReponer ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-marca-otono text-white shadow-xs">
                          REPONER
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-marca-lima/40 text-stone-800 border border-marca-lima">
                          STOCK OK
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {onAjustarStock && (
                          <button
                            type="button"
                            onClick={() => onAjustarStock(prod)}
                            className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-200 hover:border-stone-300 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Ajustar stock de freezer de ${prod.nombre}`}
                          >
                            Ajustar Stock
                          </button>
                        )}

                        {onCocinarProducto && (
                          prod.ingredientes && prod.ingredientes.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => onCocinarProducto(prod.id)}
                              className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-semibold text-marca-canela hover:text-white hover:bg-marca-canela active:bg-[#7b4629] border border-marca-canela/40 hover:border-marca-canela rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Agregar producción de ${prod.nombre}`}
                            >
                              Agregar
                            </button>
                          ) : (
                            <span
                              className="text-[10px] text-stone-400 italic py-1 px-2 border border-dashed border-stone-200 rounded-lg text-center select-none"
                              title="Definí los ingredientes en la solapa Recetas antes de cocinar"
                            >
                              Sin receta
                            </span>
                          )
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* VISTA 2: HISTORIAL DE LOTES COCINADOS */}
      {vistaActiva === 'historial' && (
        <section className="space-y-3" aria-label="Historial de tandas cocinadas">
          {lotesFiltrados.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-stone-500 space-y-2">
              <p className="text-sm font-semibold text-stone-700">No hay tandas registradas</p>
              <p className="text-xs text-stone-400">
                {busqueda
                  ? 'No se encontraron lotes para esa búsqueda.'
                  : 'Tocá "Agregar" para asentar tu primera producción.'}
              </p>
            </div>
          ) : (
            lotesFiltrados.map((lote) => (
              <div
                key={lote.id}
                className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-xs hover:border-stone-300 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-marca-canela bg-marca-canela/10 px-2 py-0.5 rounded">
                      {formatearFecha(lote.fecha)}
                    </span>
                    {lote.categoria && (
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {lote.categoria}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 mt-1 truncate">
                    {lote.nombreProducto}
                  </h3>

                  <p className="text-xs text-stone-600 mt-0.5">
                    Elaborado:{' '}
                    <strong className="text-stone-900 font-bold">
                      +{lote.cantidadElaborada} {lote.unidadVenta}
                    </strong>
                  </p>

                  {lote.observaciones && (
                    <p className="text-xs italic text-stone-500 mt-1.5 bg-stone-50 p-1.5 rounded border border-stone-100">
                      "{lote.observaciones}"
                    </p>
                  )}
                </div>

                {onEliminarLote && (
                  <button
                    type="button"
                    onClick={() => onEliminarLote(lote)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-semibold text-stone-400 hover:text-marca-tomate hover:bg-red-50 active:bg-red-100 rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Anular o eliminar este lote"
                    aria-label={`Eliminar lote de ${lote.nombreProducto} del ${formatearFecha(lote.fecha)}`}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
};
