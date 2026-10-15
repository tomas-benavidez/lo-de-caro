import React, { useState, useMemo } from 'react';
import { LoteProduccion } from '../../domain/models/loteProduccion.ts';
import { Producto } from '../../domain/models/producto.ts';
import { clasificarStockCongelado } from '../../domain/services/produccionServicio.ts';

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
 * Formatea valores numéricos a moneda argentina ($ 1.250,50).
 */
function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
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
 * Diseñado bajo la especificación oficial de Stitch "Lo de Caro — Obrador Digital".
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

  // Mapa rápido de productos por ID para cálculos de insumos y costos en el historial
  const productosMap = useMemo(() => {
    const mapa = new Map<string, Producto>();
    for (const p of productos) {
      mapa.set(p.id, p);
    }
    return mapa;
  }, [productos]);

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
        (l.categoria && l.categoria.toLowerCase().includes(q)) ||
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
      <div className="space-y-4 py-6" role="status" aria-label="Cargando datos de producción">
        <div className="h-20 bg-white/70 backdrop-blur-sm animate-pulse rounded-xl border border-stone-200/50" />
        <div className="h-12 bg-white/70 backdrop-blur-sm animate-pulse rounded-xl border border-stone-200/50" />
        <div className="h-12 bg-white/70 backdrop-blur-sm animate-pulse rounded-xl border border-stone-200/50" />
        <div className="h-32 bg-white/70 backdrop-blur-sm animate-pulse rounded-xl border border-stone-200/50" />
        <div className="h-32 bg-white/70 backdrop-blur-sm animate-pulse rounded-xl border border-stone-200/50" />
        <span className="sr-only">Cargando datos de producción y freezer...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="p-5 bg-red-50/95 border border-marca-tomate/30 rounded-xl text-stone-900 space-y-3 my-4 shadow-sm"
      >
        <div className="flex items-center gap-2 text-marca-tomate font-semibold text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-bold">Error al cargar producción y freezer</span>
        </div>
        <p className="text-xs text-stone-700">{error}</p>
        {onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-2 px-3 py-1.5 text-xs bg-transparent text-marca-canela border-2 border-marca-canela hover:bg-marca-canela/10 active:bg-marca-canela/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-4 pb-12" aria-label="Módulo de Producción y Stock de Congelados">
      {/* 4.a Cabecera de módulo con estética de obrador y botón CTA en tomate */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-[#FAF7EA]/95 border border-stone-200/80 p-4 sm:p-5 rounded-xl shadow-xs">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-marca-tomate text-white shadow-xs shrink-0">
            {/* Ícono de cocina / horno de obrador */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </span>
          <div className="min-w-0 space-y-0.5">
            <span className="font-semibold text-xs uppercase tracking-wider text-marca-canela block">
              Cocina &amp; Almacenamiento en Frío
            </span>
            <h2 className="font-titular text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Producción y Stock de Congelados
            </h2>
            <p className="text-xs text-stone-600 flex items-center gap-1.5 flex-wrap">
              <span>{productos.length} productos en catálogo</span>
              <span>•</span>
              <span className={resumenFreezer.totalCriticos > 0 ? 'text-marca-otono font-semibold' : 'text-stone-600'}>
                {resumenFreezer.totalCriticos > 0
                  ? `${resumenFreezer.totalCriticos} por reponer`
                  : 'Freezer al día'}
              </span>
              <span>•</span>
              <span>{lotes.length} tandas elaboradas</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAbrirNuevoModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:bg-[#9f1f13] active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap self-start sm:self-center"
          aria-label="Registrar nueva producción culinaria"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Registrar Producción</span>
        </button>
      </div>

      {/* 4.b Selector de sub-vistas con pastillas horizontales */}
      <div className="flex bg-[#FAF7EA]/90 border border-stone-200/80 rounded-xl p-1 shadow-xs gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setVistaActiva('freezer')}
          aria-pressed={vistaActiva === 'freezer'}
          aria-label={`Stock en Freezer (${productos.length} productos${
            resumenFreezer.totalCriticos > 0 ? `, ${resumenFreezer.totalCriticos} por reponer` : ''
          })`}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            vistaActiva === 'freezer'
              ? 'bg-marca-canela text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 active:bg-stone-300 active:scale-[0.99]'
          }`}
        >
          {/* Ícono copo de nieve / freezer */}
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3m-3 15l-3-3m3 3l3-3M4 12h16m-16 0l3-3m-3 3l3 3m13-3l-3-3m3 3l3 3M6.34 6.34l11.32 11.32m-11.32 0L17.66 6.34" />
          </svg>
          <span>Stock en Freezer</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              vistaActiva === 'freezer'
                ? 'bg-white/20 text-white'
                : 'bg-stone-200 text-stone-700'
            }`}
          >
            {productos.length}
          </span>
          {resumenFreezer.totalCriticos > 0 && (
            <span
              className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                vistaActiva === 'freezer'
                  ? 'bg-white text-marca-canela'
                  : 'bg-marca-otono text-white'
              }`}
            >
              {resumenFreezer.totalCriticos} por reponer
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setVistaActiva('historial')}
          aria-pressed={vistaActiva === 'historial'}
          aria-label={`Historial de Lotes (${lotes.length} tandas cocinadas)`}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            vistaActiva === 'historial'
              ? 'bg-marca-canela text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 active:bg-stone-300 active:scale-[0.99]'
          }`}
        >
          {/* Ícono cronología / reloj */}
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Historial de Lotes</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              vistaActiva === 'historial'
                ? 'bg-white/20 text-white'
                : 'bg-stone-200 text-stone-700'
            }`}
          >
            {lotes.length} {lotes.length === 1 ? 'tanda' : 'tandas'}
          </span>
        </button>
      </div>

      {/* 4.c Filtro de stock para Freezer y Buscador ágil sobre fondo cálido */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-stone-200/60 shadow-sm">
        {/* Buscador táctil con 5 estados */}
        <div className="relative flex-1">
          <label htmlFor="buscador-produccion" className="sr-only">
            Buscar producto en freezer o historial de lotes
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="buscador-produccion"
            name="buscador-produccion"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={
              vistaActiva === 'freezer'
                ? 'Buscar producto en freezer por nombre o categoría...'
                : 'Buscar por plato cocinado, fecha o nota...'
            }
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-lg bg-stone-50/90 text-stone-900 border border-stone-200/80 placeholder-stone-400 transition-all duration-150 hover:border-marca-canela/60 active:border-marca-canela focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 active:text-stone-900 text-xs p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Pastillas de filtro de stock (Visibles en la solapa de Freezer) */}
        {vistaActiva === 'freezer' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 shrink-0" role="toolbar" aria-label="Filtros de estado de freezer">
            <span className="text-xs font-semibold text-stone-500 hidden md:inline mr-1">Filtrar:</span>
            
            {/* Todos */}
            <button
              type="button"
              onClick={() => setFiltroStock('todos')}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                filtroStock === 'todos'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300'
              }`}
            >
              Todos ({productos.length})
            </button>

            {/* Por reponer */}
            <button
              type="button"
              onClick={() => setFiltroStock('reponer')}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E56B31] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                filtroStock === 'reponer'
                  ? 'bg-[#E56B31] text-white shadow-xs font-bold'
                  : 'bg-orange-50 text-stone-800 border border-[#E56B31]/30 hover:bg-orange-100/70 active:bg-orange-200/70'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filtroStock === 'reponer' ? 'bg-white' : 'bg-[#E56B31]'}`} />
              <span>Por reponer ({resumenFreezer.totalCriticos})</span>
            </button>

            {/* Stock OK */}
            <button
              type="button"
              onClick={() => setFiltroStock('ok')}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0D873] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                filtroStock === 'ok'
                  ? 'bg-[#C0D873] text-stone-900 shadow-xs font-bold border border-[#a3be4a]'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#465800]" />
              <span>Stock OK ({resumenFreezer.saludables})</span>
            </button>
          </div>
        )}
      </div>

      {/* 4.d VISTA 1: STOCK DE PRODUCTOS EN EL FREEZER */}
      {vistaActiva === 'freezer' && (
        <section className="space-y-3" aria-label="Listado de productos congelados en freezer">
          {productosFiltrados.length === 0 ? (
            /* 4.f Estado vacío amigable para freezer */
            <div className="text-center py-12 px-6 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/60 shadow-sm flex flex-col items-center justify-center">
              <div className="w-20 h-20 mb-3 flex items-center justify-center">
                <img
                  src="/personajes/Recurso 7.svg"
                  alt="Ilustración freezer Lo de Caro"
                  className="w-16 h-16 object-contain opacity-90"
                />
              </div>
              <h3 className="font-titular font-bold text-stone-900 text-base sm:text-lg">
                {busqueda
                  ? 'No se encontraron productos en el freezer con ese nombre'
                  : '¡El freezer está esperando nuevas tandas, Caro!'}
              </h3>
              <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-md">
                {busqueda
                  ? 'Probá borrando el filtro de búsqueda o cambiando el término.'
                  : 'Creá tus recetas en la solapa "Recetas" y asentá tus tandas de cocina para tener el stock congelado siempre al día y listo para vender.'}
              </p>
              {!busqueda && (
                <button
                  type="button"
                  onClick={onAbrirNuevoModal}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Cocinar primera tanda</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {productosFiltrados.map((prod) => {
                const estado = clasificarStockCongelado(prod.stockActual, prod.stockMinimo);
                const esSinStock = estado === 'SIN_STOCK';
                const esReponer = estado === 'REPONER';
                const tieneReceta = prod.ingredientes && prod.ingredientes.length > 0;

                return (
                  <div
                    key={prod.id}
                    className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border transition-all duration-200 hover:shadow-md flex flex-col justify-between gap-4 ${
                      esSinStock
                        ? 'border-marca-tomate/40 bg-red-50/15'
                        : esReponer
                        ? 'border-[#E56B31]/40 bg-orange-50/15'
                        : 'border-stone-200/60 hover:border-stone-300'
                    }`}
                  >
                    {/* Encabezado de la tarjeta: Título, categoría y Badge de estado */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-titular font-bold text-stone-900 text-lg leading-tight truncate">
                              {prod.nombre}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-label-sm text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF7EA] text-marca-canela border border-marca-canela/20">
                              {prod.categoria}
                            </span>
                            <span className="text-[11px] text-stone-500 font-medium">
                              Venta por {prod.unidadVenta}
                            </span>
                          </div>
                        </div>

                        {/* Badges según estado de congelados */}
                        <div className="shrink-0">
                          {esSinStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-marca-tomate text-white shadow-xs tracking-wider uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              SIN STOCK
                            </span>
                          ) : esReponer ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E56B31] text-white shadow-xs tracking-wider uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              BAJO / REPONER
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#C0D873] text-stone-900 shadow-xs tracking-wider uppercase border border-[#a3be4a]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#465800]" />
                              STOCK OK
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contador de Stock en Freezer */}
                      <div className="mt-3.5 p-3 rounded-xl bg-[#FAF7EA]/80 border border-stone-200/50 flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                            En freezer disponible
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="font-titular text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-none">
                              {prod.stockActual}
                            </span>
                            <span className="text-xs font-semibold text-stone-600">
                              {prod.unidadVenta}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-stone-500 font-medium block">
                            Punto mínimo
                          </span>
                          <span className="text-xs font-bold text-stone-700">
                            {prod.stockMinimo} {prod.unidadVenta}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción táctil con 5 estados */}
                    <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                      {/* Ajustar stock */}
                      {onAjustarStock && (
                        <button
                          type="button"
                          onClick={() => onAjustarStock(prod)}
                          className="flex-1 min-h-[44px] px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-200 hover:border-stone-300 rounded-lg transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          aria-label={`Ajustar stock de freezer de ${prod.nombre}`}
                        >
                          <svg className="w-4 h-4 text-stone-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span>Ajustar stock</span>
                        </button>
                      )}

                      {/* Cocinar tanda */}
                      {onCocinarProducto && (
                        tieneReceta ? (
                          <button
                            type="button"
                            onClick={() => onCocinarProducto(prod.id)}
                            className="flex-1 min-h-[44px] px-3.5 py-2 text-xs font-bold text-white bg-marca-tomate hover:bg-marca-tomate/90 active:bg-[#9f1f13] active:scale-[0.98] rounded-lg shadow-xs transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            aria-label={`Cocinar tanda de ${prod.nombre}`}
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            </svg>
                            <span>Cocinar tanda</span>
                          </button>
                        ) : (
                          <span
                            className="flex-1 min-h-[44px] px-2 py-2 text-[11px] text-stone-400 italic border border-dashed border-stone-200 rounded-lg inline-flex items-center justify-center text-center select-none"
                            title="Definí los ingredientes en la solapa Recetas antes de cocinar"
                          >
                            Sin receta asignada
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4.e VISTA 2: HISTORIAL DE LOTES COCINADOS */}
      {vistaActiva === 'historial' && (
        <section className="space-y-3" aria-label="Historial de tandas cocinadas en obrador">
          {lotesFiltrados.length === 0 ? (
            /* 4.f Estado vacío amigable para historial */
            <div className="text-center py-12 px-6 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/60 shadow-sm flex flex-col items-center justify-center">
              <div className="w-20 h-20 mb-3 flex items-center justify-center">
                <img
                  src="/personajes/Recurso 8.svg"
                  alt="Ilustración obrador Lo de Caro"
                  className="w-16 h-16 object-contain opacity-90"
                />
              </div>
              <h3 className="font-titular font-bold text-stone-900 text-base sm:text-lg">
                {busqueda
                  ? 'No se encontraron lotes para esa búsqueda'
                  : 'Todavía no hay tandas cocinadas registradas'}
              </h3>
              <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-md">
                {busqueda
                  ? 'Verificá el texto ingresado o limpiá el buscador para ver el historial completo.'
                  : 'Cada vez que cocines y asientes una tanda, quedará registrada aquí con el descuento automático de insumos y el costo total del lote.'}
              </p>
              {!busqueda && (
                <button
                  type="button"
                  onClick={onAbrirNuevoModal}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Asentar primer lote</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {lotesFiltrados.map((lote) => {
                const prodAsociado = productosMap.get(lote.productoId);
                const tieneIngredientes = prodAsociado && prodAsociado.ingredientes && prodAsociado.ingredientes.length > 0;
                
                // Cálculo de costo total del lote si la receta tiene ingredientes cargados
                const costoUnitarioMP = tieneIngredientes
                  ? prodAsociado.ingredientes.reduce((sum, ing) => sum + ing.cantidad * ing.costoUnitario, 0)
                  : 0;
                const costoTotalLote = Math.round(costoUnitarioMP * lote.cantidadElaborada * 100) / 100;

                return (
                  <div
                    key={lote.id}
                    className="bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between gap-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-marca-canela bg-marca-canela/10 px-2.5 py-1 rounded-md">
                            {formatearFecha(lote.fecha)}
                          </span>
                          {lote.categoria && (
                            <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                              {lote.categoria}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#465800] bg-[#C0D873]/30 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#465800]" />
                            En freezer
                          </span>
                        </div>

                        <h3 className="font-titular font-bold text-stone-900 text-lg leading-tight mt-1 truncate">
                          {lote.nombreProducto}
                        </h3>

                        <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
                          <span className="text-xs text-stone-500 font-medium">Cantidad cocinada:</span>
                          <span className="font-titular font-bold text-stone-900 text-base">
                            +{lote.cantidadElaborada} {lote.unidadVenta}
                          </span>
                          {costoTotalLote > 0 && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span className="text-xs text-stone-500 font-medium">Costo insumos lote:</span>
                              <span className="text-xs font-bold text-marca-tomate">
                                {formatearMoneda(costoTotalLote)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Botón táctil para anular lote con 5 estados obligatorios */}
                      {onEliminarLote && (
                        <div className="shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => onEliminarLote(lote)}
                            className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold text-stone-600 hover:text-marca-tomate bg-stone-100 hover:bg-red-50 active:bg-red-100 active:scale-[0.98] border border-stone-200 hover:border-marca-tomate/30 rounded-lg transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Anular o eliminar este lote de cocina"
                            aria-label={`Anular lote de ${lote.nombreProducto} del ${formatearFecha(lote.fecha)}`}
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Anular lote</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desglose de insumos descontados automáticamente según la receta */}
                    {tieneIngredientes && (
                      <div className="p-3 rounded-lg bg-[#FAF7EA]/90 border border-stone-200/60 text-xs text-stone-700 space-y-1">
                        <div className="flex items-center gap-1.5 text-marca-canela font-semibold text-[11px] uppercase tracking-wider">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Insumos descontados automáticamente de la despensa:</span>
                        </div>
                        <p className="text-stone-600 pl-5">
                          {prodAsociado.ingredientes.map((ing) => {
                            const cantTotal = Math.round(ing.cantidad * lote.cantidadElaborada * 100) / 100;
                            return `${ing.nombreMateriaPrima} (${cantTotal} ${ing.unidadMedida})`;
                          }).join(' • ')}
                        </p>
                      </div>
                    )}

                    {/* Observaciones registradas durante la cocción */}
                    {lote.observaciones && (
                      <div className="text-xs text-stone-600 bg-stone-50/90 border border-stone-200/50 p-2.5 rounded-lg flex items-start gap-2">
                        <span className="text-stone-400 italic">“{lote.observaciones}”</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Sincronización automática de alacena (Garantía operativa de Stitch) */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF7EA] border border-stone-200/70 flex items-center justify-between gap-3 text-xs text-stone-700 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-marca-canela/10 text-marca-canela shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-stone-900">Sincronización Automática con la Despensa</p>
            <p className="text-stone-500 text-[11px] sm:text-xs">
              Al asentar un lote cocinado, el sistema descuenta gramos exactos de Materias Primas y actualiza el stock congelado.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#C0D873] text-stone-900 shrink-0">
          Activo
        </span>
      </div>
    </section>
  );
};
