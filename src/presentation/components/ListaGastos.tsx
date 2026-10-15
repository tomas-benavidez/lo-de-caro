import React, { useState, useMemo } from 'react';
import {
  Gasto,
  ResumenGastos,
  CategoriaGastoFiltro,
  MetodoPagoGasto,
} from '../../domain/models/gasto.ts';
import { filtrarGastos } from '../../domain/services/gastoServicio.ts';

export interface ListaGastosProps {
  gastos: Gasto[];
  resumen: ResumenGastos;
  cargando: boolean;
  error: string | null;
  onAbrirNuevoGasto: () => void;
  onEliminarGasto: (gasto: Gasto) => void;
  onReintentar: () => void;
}

/**
 * Formatea una fecha YYYY-MM-DD a formato argentino DD/MM/YYYY.
 */
export function formatearFecha(fechaStr: string): string {
  if (!fechaStr) return '';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaStr;
}

const CATEGORIAS_FILTRO: CategoriaGastoFiltro[] = [
  'Todas',
  'Materia Prima',
  'Packaging',
  'Servicios',
  'Equipamiento',
  'Otros',
];

/**
 * Componente rediseñado de Gastos y Egresos del Obrador según la especificación Stitch
 * ("Warm Tactile Minimalism" para Lo de Caro).
 * Incluye cabecera de obrador con CTA de marca, barra de 4 métricas financieras (Total Gastado,
 * Gastos Fijos, Gastos Variables y Compras de Materia Prima vinculadas), pastillas táctiles de
 * filtrado por categoría y método de pago, fichas de gastos con impacto en stock y botón de anulación
 * con 5 estados UI, y estado vacío ilustrado con Recurso 9.svg.
 */
export const ListaGastos: React.FC<ListaGastosProps> = ({
  gastos,
  resumen,
  cargando,
  error,
  onAbrirNuevoGasto,
  onEliminarGasto,
  onReintentar,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaGastoFiltro>('Todas');
  const [metodoFiltro, setMetodoFiltro] = useState<'Todos' | MetodoPagoGasto>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Gastos filtrados con la función pura de dominio
  const gastosFiltrados = useMemo(() => {
    return filtrarGastos(gastos, categoriaFiltro, metodoFiltro, busqueda);
  }, [gastos, categoriaFiltro, metodoFiltro, busqueda]);

  // Cálculo proporcional de gastos fijos y variables
  const totalGastosFijos = useMemo(() => {
    return gastos
      .filter((g) => g.categoria === 'Servicios' || g.categoria === 'Equipamiento')
      .reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
  }, [gastos]);

  const totalGastosVariables = useMemo(() => {
    return gastos
      .filter((g) => g.categoria === 'Packaging' || g.categoria === 'Otros')
      .reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
  }, [gastos]);

  const estiloInput =
    'w-full bg-white/95 border border-stone-300 rounded-lg p-2.5 pl-9 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ' +
    'focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:cursor-not-allowed ' +
    'shadow-2xs transition-colors';

  if (cargando && gastos.length === 0) {
    return (
      <div className="space-y-4 py-4" role="status" aria-label="Cargando gastos del obrador">
        <div className="h-16 bg-white/70 backdrop-blur-sm animate-pulse rounded-xl border border-stone-200/50" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-20 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-20 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        </div>
      </div>
    );
  }

  if (error && gastos.length === 0) {
    return (
      <div
        role="alert"
        className="p-5 bg-red-50/90 border border-marca-tomate/30 rounded-xl text-stone-900 space-y-3 my-4 shadow-sm text-center"
      >
        <div className="flex items-center justify-center gap-2 text-marca-tomate font-semibold text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>No pudimos cargar los datos de gastos del obrador</span>
        </div>
        <p className="text-xs text-stone-700">{error}</p>
        <button
          type="button"
          onClick={onReintentar}
          className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none px-4 py-2 text-xs bg-marca-canela text-white hover:bg-marca-canela/90 active:bg-marca-canela/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-5" aria-label="Módulo de Gastos y Egresos del Obrador">
      {/* 4.a Cabecera de módulo con ícono de egresos, subtítulo de taller, título de alto impacto y botón CTA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-marca-canela mb-1">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
              />
            </svg>
            <span className="text-xs uppercase tracking-wider font-semibold">
              Control de Costos de Estructura y Taller
            </span>
          </div>
          <h2 className="font-titular text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Gastos y Egresos del Obrador
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Registro de compras de materias primas, packaging, servicios fijos y costos de estructura
          </p>
        </div>

        {/* Botón CTA con 5 estados interactivos obligatorios */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onAbrirNuevoGasto}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2 focus-visible:ring-offset-marca-beige disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Registrar nuevo gasto o compra de insumos"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* 4.b Barra de 4 Métricas de Gastos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Métrica 1: Total Gastado */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
              Total Gastado
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full shrink-0">
              {resumen.cantidadGastos} {resumen.cantidadGastos === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <div>
            <span className="font-titular text-xl sm:text-2xl lg:text-3xl font-bold text-marca-tomate block leading-tight">
              ${resumen.totalGastos.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block truncate">
              Egresos totales acumulados
            </span>
          </div>
        </div>

        {/* Métrica 2: Gastos Fijos */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
              Gastos Fijos
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full shrink-0">
              Estructura
            </span>
          </div>
          <div>
            <span className="font-titular text-xl sm:text-2xl lg:text-3xl font-bold text-stone-800 block leading-tight">
              ${totalGastosFijos.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block truncate">
              Servicios y equipamiento
            </span>
          </div>
        </div>

        {/* Métrica 3: Gastos Variables */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
              Gastos Variables
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full shrink-0">
              Operativos
            </span>
          </div>
          <div>
            <span className="font-titular text-xl sm:text-2xl lg:text-3xl font-bold text-stone-800 block leading-tight">
              ${totalGastosVariables.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block truncate">
              Packaging, fletes y varios
            </span>
          </div>
        </div>

        {/* Métrica 4: Compras de Materia Prima vinculadas */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
              Materia Prima
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200/60 shrink-0">
              📦 Insumos
            </span>
          </div>
          <div>
            <span className="font-titular text-xl sm:text-2xl lg:text-3xl font-bold text-amber-800 block leading-tight">
              ${resumen.totalMateriaPrima.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block truncate">
              Harinas, carnes y stock vivo
            </span>
          </div>
        </div>
      </div>

      {/* 4.c Filtros y Buscador */}
      <div className="space-y-3">
        {/* Buscador de gastos */}
        <div className="relative">
          <label htmlFor="input-buscar-gastos" className="sr-only">
            Buscar gastos por concepto o detalle
          </label>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="input-buscar-gastos"
            name="buscarGastos"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por concepto, detalle o proveedor..."
            className={estiloInput}
            aria-label="Buscar gastos por concepto"
          />
          {busqueda && (
            <button
              type="button"
              disabled={cargando}
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Pastillas de Categorías */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Filtrar por Categoría:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIAS_FILTRO.map((cat) => {
              const activo = categoriaFiltro === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  disabled={cargando}
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    activo
                      ? 'bg-marca-canela text-white shadow-xs'
                      : 'bg-white/90 text-stone-600 border border-stone-200/80 hover:border-stone-300 hover:text-stone-900 hover:bg-white active:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pastillas de Método de Pago */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-stone-500 font-semibold uppercase text-[11px] tracking-wider">
            Vía de Pago:
          </span>
          {(['Todos', 'Efectivo', 'Transferencia'] as const).map((metodo) => {
            const activo = metodoFiltro === metodo;
            return (
              <button
                key={metodo}
                type="button"
                disabled={cargando}
                onClick={() => setMetodoFiltro(metodo)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  activo
                    ? 'bg-stone-800 text-white font-semibold shadow-xs'
                    : 'bg-white/90 text-stone-600 border border-stone-200/80 hover:border-stone-300 hover:text-stone-900 hover:bg-white active:bg-stone-100'
                }`}
              >
                {metodo === 'Todos' ? 'Todos' : metodo === 'Efectivo' ? '💵 Efectivo' : '💳 Transferencia'}
              </button>
            );
          })}

          <div className="ml-auto hidden sm:flex items-center gap-3 text-[11px] text-stone-500 font-medium bg-white/70 px-2.5 py-1 rounded-lg border border-stone-200/50">
            <span className="text-emerald-700 font-semibold">Efec: ${resumen.totalEfectivo.toLocaleString('es-AR')}</span>
            <span>•</span>
            <span className="text-blue-700 font-semibold">Transf: ${resumen.totalTransferencia.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>

      {/* 4.d Fichas de gastos o Estado Vacío */}
      {gastosFiltrados.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/80 shadow-xs space-y-3">
          <img
            src="/personajes/Recurso 9.svg"
            alt="Ilustración oficial de gastos y compras del obrador"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto opacity-90 object-contain"
          />
          <p className="text-stone-900 font-bold text-base">
            {busqueda || categoriaFiltro !== 'Todas' || metodoFiltro !== 'Todos'
              ? 'No se encontraron gastos con los filtros aplicados'
              : 'Aún no registraste ningún gasto en el obrador'}
          </p>
          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
            {busqueda || categoriaFiltro !== 'Todas' || metodoFiltro !== 'Todos'
              ? 'Probá cambiando la categoría, método de pago o borrando el texto del buscador.'
              : 'Anotá tus compras de harinas, packaging o facturas de servicios para llevar el control real de tu negocio.'}
          </p>
          {busqueda || categoriaFiltro !== 'Todas' || metodoFiltro !== 'Todos' ? (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setCategoriaFiltro('Todas');
                setMetodoFiltro('Todos');
              }}
              className="inline-flex items-center justify-center font-semibold rounded-lg px-3.5 py-1.5 text-xs text-marca-canela border border-marca-canela/40 hover:bg-marca-canela/10 active:bg-marca-canela/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela cursor-pointer"
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              type="button"
              onClick={onAbrirNuevoGasto}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate cursor-pointer"
            >
              + Cargar primer gasto
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {gastosFiltrados.map((gasto) => {
            const badgeCategoria = {
              'Materia Prima': 'bg-amber-50 text-amber-800 border-amber-200',
              Packaging: 'bg-orange-50 text-orange-800 border-orange-200',
              Servicios: 'bg-blue-50 text-blue-800 border-blue-200',
              Equipamiento: 'bg-purple-50 text-purple-800 border-purple-200',
              Otros: 'bg-stone-100 text-stone-700 border-stone-200',
            }[gasto.categoria];

            return (
              <div
                key={gasto.id}
                className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Lado izquierdo: Fecha, Badges, Concepto e Impacto */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                      <svg
                        className="w-3.5 h-3.5 text-stone-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formatearFecha(gasto.fecha)}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeCategoria}`}
                    >
                      {gasto.categoria}
                    </span>

                    <span
                      className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${
                        gasto.metodoPago === 'Efectivo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {gasto.metodoPago === 'Efectivo' ? '💵 Efectivo' : '💳 Transferencia'}
                    </span>
                  </div>

                  <h3 className="font-titular text-base sm:text-lg font-bold text-stone-900 truncate">
                    {gasto.concepto}
                  </h3>

                  {/* Impacto en stock de materia prima */}
                  {gasto.compraMateriaPrima && (
                    <div className="text-xs text-amber-900 bg-amber-50/80 border border-amber-200/80 rounded-lg px-3 py-1.5 inline-flex flex-wrap items-center gap-1.5">
                      <span className="font-bold">📦 Insumo actualizado:</span>
                      <span className="font-semibold text-amber-950">
                        +{gasto.compraMateriaPrima.cantidadComprada}{' '}
                        {gasto.compraMateriaPrima.unidadMedida}
                      </span>
                      <span className="text-stone-500 font-medium">
                        de {gasto.compraMateriaPrima.nombreMateriaPrima}
                      </span>
                      {gasto.compraMateriaPrima.nuevoCostoUnitario && (
                        <span className="text-amber-800 font-medium">
                          (a ${gasto.compraMateriaPrima.nuevoCostoUnitario.toLocaleString('es-AR')}/
                          {gasto.compraMateriaPrima.unidadMedida})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Lado derecho: Monto y Acción de Anular con 5 estados */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-stone-400 block sm:hidden">Monto egresado:</span>
                    <span className="font-titular text-xl sm:text-2xl font-bold text-marca-tomate block leading-tight">
                      -${gasto.monto.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={cargando}
                    onClick={() => onEliminarGasto(gasto)}
                    aria-label={`Anular gasto ${gasto.concepto}`}
                    className="px-3 py-2 text-xs font-semibold text-stone-500 bg-stone-50/80 hover:text-marca-tomate hover:bg-red-50 hover:border-red-200 active:bg-red-100 active:scale-[0.98] rounded-lg border border-stone-200 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Anular
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
