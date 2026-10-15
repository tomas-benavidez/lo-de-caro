import React, { useState, useMemo } from 'react';
import { MateriaPrima } from '../../domain/models/materiaPrima.ts';
import { Gasto } from '../../domain/models/gasto.ts';
import { evaluarEstadoStock } from '../../domain/services/calculadorCostos.ts';

export interface ListaMateriasPrimasProps {
  materiasPrimas: MateriaPrima[];
  gastos?: Gasto[];
  cargando: boolean;
  error: string | null;
  onAbrirNuevoModal: () => void;
  onEditar?: (materiaPrima: MateriaPrima) => void;
  onEliminar?: (materiaPrima: MateriaPrima) => void;
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
 * Formatea una fecha YYYY-MM-DD a formato argentino DD/MM/YYYY.
 */
function formatearFechaArgentina(fechaStr: string): string {
  if (!fechaStr) return '';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaStr;
}

/**
 * Retorna un ícono temático SVG según el nombre del ingrediente,
 * reforzando la estética cálida y artesanal de cocina.
 */
function renderIconoIngrediente(nombre: string): React.ReactNode {
  const n = nombre.toLowerCase();

  // Harinas, cereales, masas, granos
  if (
    n.includes('harin') ||
    n.includes('trigo') ||
    n.includes('avena') ||
    n.includes('cereal') ||
    n.includes('semol') ||
    n.includes('masa')
  ) {
    return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18c-2 2-3 5-1 8 2-3 1-6 1-8zm0 0c2 2 3 5 1 8-2-3-1-6-1-8zm0 6c-2 2-3 5-1 8 2-3 1-6 1-8zm0 0c2 2 3 5 1 8-2-3-1-6-1-8z" />
      </svg>
    );
  }

  // Huevos
  if (n.includes('huevo')) {
    return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C8.5 3 6 8.5 6 14.5a6 6 0 0012 0C18 8.5 15.5 3 12 3z" />
      </svg>
    );
  }

  // Verduras y aromáticas
  if (
    n.includes('ceboll') ||
    n.includes('verdeo') ||
    n.includes('ajo') ||
    n.includes('tomat') ||
    n.includes('pimient') ||
    n.includes('morron') ||
    n.includes('acelg') ||
    n.includes('espinac') ||
    n.includes('albahac') ||
    n.includes('perejil') ||
    n.includes('papa') ||
    n.includes('zanahori') ||
    n.includes('calabaz') ||
    n.includes('zapall')
  ) {
    return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 14c-4 0-7-3-7-7 0-3.5 2.5-6.5 6-7m1 14c4 0 7-3 7-7 0-3.5-2.5-6.5-6-7" />
      </svg>
    );
  }

  // Lácteos y quesos
  if (
    n.includes('queso') ||
    n.includes('mozzar') ||
    n.includes('muzzar') ||
    n.includes('ricot') ||
    n.includes('lech') ||
    n.includes('crema') ||
    n.includes('mantec') ||
    n.includes('dulce de leche') ||
    n.includes('ddl')
  ) {
    return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11l-8-7-8 7m16 0v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7m16 0H3" />
        <circle cx="8.5" cy="15.5" r="1.5" />
        <circle cx="14.5" cy="14.5" r="1" />
      </svg>
    );
  }

  // Carnes y proteínas
  if (
    n.includes('carn') ||
    n.includes('pollo') ||
    n.includes('jamon') ||
    n.includes('jamón') ||
    n.includes('pancet') ||
    n.includes('lomo') ||
    n.includes('cerdo')
  ) {
    return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }

  // Despensa general / Default
  return (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

/**
 * Componente rediseñado de Materias Primas e Insumos según la especificación Stitch
 * ("Warm Tactile Minimalism" para Lo de Caro).
 * Incluye KPIs de despensa, búsqueda rápida, tarjetas táctiles de ingredientes con 5 estados UI,
 * acordeón de historial de precios y estado vacío ilustrado.
 */
export const ListaMateriasPrimas: React.FC<ListaMateriasPrimasProps> = ({
  materiasPrimas,
  gastos = [],
  cargando,
  error,
  onAbrirNuevoModal,
  onEditar,
  onEliminar,
  onReintentar,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [historialExpandido, setHistorialExpandido] = useState<Record<string, boolean>>({});

  const toggleHistorial = (id: string) => {
    setHistorialExpandido((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const materiasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return materiasPrimas;
    return materiasPrimas.filter((m) => m.nombre.toLowerCase().includes(termino));
  }, [materiasPrimas, busqueda]);

  // Cálculo de métricas superiores (4 KPIs de Stitch)
  const metricas = useMemo(() => {
    const total = materiasPrimas.length;
    let saludables = 0;
    let reponer = 0;
    let valorizado = 0;

    for (const m of materiasPrimas) {
      const estado = evaluarEstadoStock(m.stockActual, m.stockMinimo);
      if (estado === 'OK') {
        saludables += 1;
      } else {
        reponer += 1;
      }
      const stockVal = Math.max(0, m.stockActual);
      valorizado += stockVal * m.costoUnitario;
    }

    return {
      total,
      saludables,
      reponer,
      valorizado: Math.round(valorizado * 100) / 100,
    };
  }, [materiasPrimas]);

  if (cargando) {
    return (
      <div className="space-y-4 py-6" role="status" aria-label="Cargando materias primas">
        <div className="h-16 bg-white/70 backdrop-blur-sm animate-pulse rounded-xl border border-stone-200/50" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="h-20 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-20 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-20 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-20 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        </div>
        <div className="h-12 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        <span className="sr-only">Cargando materias primas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="p-5 bg-red-50/90 border border-marca-tomate/30 rounded-xl text-stone-900 space-y-3 my-4 shadow-sm"
      >
        <div className="flex items-center gap-2 text-marca-tomate font-semibold text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Error de conexión</span>
        </div>
        <p className="text-xs text-stone-700">{error}</p>
        {onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-2 px-3 py-1.5 text-xs bg-transparent text-marca-canela border-2 border-marca-canela hover:bg-marca-canela/10 active:bg-marca-canela/20 disabled:opacity-50 cursor-pointer"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-5" aria-label="Módulo de Materias Primas e Insumos">
      {/* 4.a Cabecera de módulo con subtítulo artesanal, título de alto impacto y CTA tomate */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-marca-canela mb-1">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="text-xs uppercase tracking-wider font-semibold">
              Despensa y Costeo Artesanal
            </span>
          </div>
          <h2 className="font-titular text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Materias Primas e Insumos
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            {materiasPrimas.length} {materiasPrimas.length === 1 ? 'insumo registrado' : 'insumos registrados'} para costeo de recetas y control de stock en despensa
          </p>
        </div>

        {/* CTA con los 5 estados obligatorios */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAbrirNuevoModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2 focus-visible:ring-offset-marca-beige disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Registrar nueva materia prima"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* 4.b Barra de 4 Métricas Superiores (Desktop 4 columnas, Mobile 2x2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Ingredientes */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
              Total Ingredientes
            </span>
            <div className="font-titular text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
              {metricas.total}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-marca-canela shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Stock Saludable */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
              Stock Saludable
            </span>
            <div className="font-titular text-xl sm:text-2xl font-bold text-[#465800] mt-0.5">
              {metricas.saludables}{' '}
              <span className="text-xs sm:text-sm font-normal text-stone-400">
                / {metricas.total}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#C0D873]/25 flex items-center justify-center text-[#465800] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* KPI 3: Alertas Reposición */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
              Alertas Reposición
            </span>
            <div
              className={`font-titular text-xl sm:text-2xl font-bold mt-0.5 ${
                metricas.reponer > 0 ? 'text-marca-otono' : 'text-stone-900'
              }`}
            >
              {metricas.reponer}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-marca-otono shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* KPI 4: Valor Valorizado */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
              Valor Valorizado
            </span>
            <div className="font-titular text-lg sm:text-xl font-bold text-marca-tomate mt-0.5 truncate">
              {formatearMoneda(metricas.valorizado)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-marca-tomate shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 4.c Barra de búsqueda rápida sobre fondo cálido con 5 estados */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-2 sm:p-2.5 border border-stone-200/60">
        <div className="relative w-full">
          <label htmlFor="buscador-materias-primas" className="sr-only">
            Buscar materia prima por nombre
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="buscador-materias-primas"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar ingrediente (ej. Harina, Ricotta, Huevos, Cebolla...)"
            className="w-full pl-11 pr-4 py-2.5 sm:py-3 text-sm rounded-lg bg-stone-50/90 text-stone-900 border border-stone-200 placeholder-stone-400 transition-all duration-150 hover:border-marca-canela/60 active:border-marca-canela focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* 4.d Filas/Tarjetas de Ingredientes o Estado Vacío */}
      {materiasFiltradas.length === 0 ? (
        <div className="text-center py-12 px-6 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/60 shadow-sm flex flex-col items-center justify-center">
          <div className="w-20 h-20 mb-3 flex items-center justify-center">
            <img
              src="/personajes/Recurso 8.svg"
              alt="Ilustración despensa"
              className="w-16 h-16 object-contain opacity-85"
            />
          </div>
          <h3 className="font-titular font-bold text-stone-900 text-base sm:text-lg">
            {busqueda ? 'No se encontraron insumos con ese nombre' : 'Todavía no hay materias primas registradas'}
          </h3>
          <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-sm">
            {busqueda
              ? 'Probá borrando el filtro de búsqueda o buscando por otro ingrediente.'
              : 'Agregá los ingredientes de tu despensa para poder costear tus recetas y controlar el stock en tiempo real.'}
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
              <span>Cargar primer insumo</span>
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {materiasFiltradas.map((item) => {
            const estado = evaluarEstadoStock(item.stockActual, item.stockMinimo);
            const necesitaReposicion = estado === 'REPONER';

            // Recuperar compras asociadas a esta materia prima desde gastos
            const comprasInsumo = gastos
              .filter((g) => g.compraMateriaPrima?.materiaPrimaId === item.id)
              .map((g) => {
                const cantidad = Number(g.compraMateriaPrima?.cantidadComprada || 0);
                const nuevoCosto = g.compraMateriaPrima?.nuevoCostoUnitario;
                const costoCalculado =
                  nuevoCosto !== undefined && nuevoCosto !== null
                    ? Number(nuevoCosto)
                    : cantidad > 0
                    ? Math.round((Number(g.monto || 0) / cantidad) * 100) / 100
                    : item.costoUnitario;

                return {
                  id: g.id,
                  fecha: g.fecha,
                  fechaCreacion: g.fechaCreacion,
                  montoTotal: Number(g.monto || 0),
                  cantidadComprada: cantidad,
                  costoUnitario: costoCalculado,
                };
              })
              .sort(
                (a, b) =>
                  a.fecha.localeCompare(b.fecha) ||
                  (a.fechaCreacion || '').localeCompare(b.fechaCreacion || '') ||
                  a.id.localeCompare(b.id)
              );

            // Calcular variación porcentual contra la compra cronológica inmediatamente anterior
            const comprasConVariacion = comprasInsumo.map((compra, index) => {
              let variacion: number | null = null;
              if (index > 0) {
                const anterior = comprasInsumo[index - 1].costoUnitario;
                if (anterior > 0) {
                  variacion = Math.round(((compra.costoUnitario - anterior) / anterior) * 1000) / 10;
                }
              }
              return { ...compra, variacion };
            });

            const cronologiaInversa = [...comprasConVariacion].reverse();
            const expandido = Boolean(historialExpandido[item.id]);

            return (
              <li
                key={item.id}
                className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Detalle principal con ícono temático y chip de stock */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-stone-100 text-marca-canela shrink-0 flex items-center justify-center">
                      {renderIconoIngrediente(item.nombre)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-titular font-bold text-stone-900 text-base sm:text-lg truncate">
                          {item.nombre}
                        </h3>
                        {necesitaReposicion ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-marca-otono/40 text-marca-otono text-[11px] font-bold"
                            role="status"
                            aria-label="Stock bajo: requiere reposición"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-marca-otono animate-pulse" />
                            STOCK BAJO
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF7EA] border border-[#C0D873]/60 text-[#465800] text-[11px] font-semibold"
                            role="status"
                            aria-label="Stock saludable"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C0D873]" />
                            STOCK OK
                          </span>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm text-stone-600 mt-1 flex items-center gap-2 flex-wrap">
                        <span>
                          Stock actual:{' '}
                          <strong className={necesitaReposicion ? 'text-marca-tomate font-bold' : 'text-stone-900 font-semibold'}>
                            {item.stockActual} {item.unidadMedida}
                          </strong>
                        </span>
                        <span className="text-stone-300">•</span>
                        <span>
                          Mínimo: <strong>{item.stockMinimo} {item.unidadMedida}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Precio destacado y botones de acción con 5 estados UI */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t border-stone-100 sm:border-t-0 shrink-0">
                    <div className="text-left sm:text-right whitespace-nowrap">
                      <div className="font-titular text-lg sm:text-xl font-bold text-stone-800 tracking-tight">
                        {formatearMoneda(item.costoUnitario)}
                      </div>
                      <div className="text-[11px] sm:text-xs text-stone-500">
                        por {item.unidadMedida}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onEditar && (
                        <button
                          type="button"
                          onClick={() => onEditar(item)}
                          aria-label={`Editar ${item.nombre}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 hover:text-stone-900 active:bg-stone-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Editar</span>
                        </button>
                      )}

                      {onEliminar && (
                        <button
                          type="button"
                          onClick={() => onEliminar(item)}
                          aria-label={`Eliminar ${item.nombre}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-marca-tomate border border-marca-tomate/20 text-xs font-semibold hover:bg-marca-tomate hover:text-white active:bg-red-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acordeón desplegable de Historial de Precios */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col">
                  <button
                    type="button"
                    onClick={() => toggleHistorial(item.id)}
                    aria-expanded={expandido}
                    aria-controls={`historial-precios-${item.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-marca-canela hover:text-stone-900 active:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 rounded px-1.5 py-1 transition-colors w-fit cursor-pointer"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${expandido ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{expandido ? 'Ocultar Historial de Precios' : 'Ver Historial de Precios'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-stone-100 text-[11px] font-normal text-stone-500">
                      ({comprasInsumo.length} {comprasInsumo.length === 1 ? 'compra' : 'compras'})
                    </span>
                  </button>

                  {expandido && (
                    <div
                      id={`historial-precios-${item.id}`}
                      className="mt-2.5 p-3 rounded-lg bg-stone-50 border border-stone-100 text-xs space-y-2 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between font-bold text-stone-700 text-[11px] border-b border-stone-200/70 pb-1.5">
                        <span>Cronología de precios de compra</span>
                        <span className="text-stone-500 font-normal">
                          Precio actual: {formatearMoneda(item.costoUnitario)}/{item.unidadMedida}
                        </span>
                      </div>

                      {cronologiaInversa.length === 0 ? (
                        <p className="text-[11px] text-stone-500 py-1">
                          No hay compras registradas en Gastos para este insumo aún. Cuando registres una compra de materia prima, verás aquí la evolución de precios y variaciones porcentuales.
                        </p>
                      ) : (
                        <div className="divide-y divide-stone-200/60">
                          {cronologiaInversa.map((c) => (
                            <div key={c.id} className="py-2 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-stone-900 font-titular">
                                    {formatearMoneda(c.costoUnitario)}
                                  </span>
                                  <span className="text-stone-500 text-[11px]">
                                    por {item.unidadMedida}
                                  </span>
                                  {c.variacion !== null && (
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                        c.variacion > 0
                                          ? 'bg-red-50 text-marca-tomate border border-red-200'
                                          : c.variacion < 0
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-stone-100 text-stone-600'
                                      }`}
                                    >
                                      {c.variacion > 0 ? `+${c.variacion}%` : `${c.variacion}%`}
                                    </span>
                                  )}
                                  {c.variacion === null && (
                                    <span className="text-[10px] text-stone-400 font-medium">
                                      (Compra base)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-stone-500 mt-0.5">
                                  {c.cantidadComprada} {item.unidadMedida} • Total: {formatearMoneda(c.montoTotal)}
                                </div>
                              </div>

                              <div className="text-[11px] font-medium text-stone-600 whitespace-nowrap text-right">
                                {formatearFechaArgentina(c.fecha)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Nota de ayuda inferior (impacto en recetas) */}
      <div className="mt-4 p-3.5 rounded-xl bg-[#FAF7EA] border border-stone-200/60 flex items-center gap-2.5 text-xs text-stone-600">
        <svg
          className="w-5 h-5 text-marca-canela shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Los costos por insumo impactan de forma instantánea en los cálculos de margen de las recetas activas.
        </span>
      </div>
    </section>
  );
};
