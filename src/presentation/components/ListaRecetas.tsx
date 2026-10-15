import React, { useState, useMemo } from 'react';
import { Producto, CategoriaProducto } from '../../domain/models/producto.ts';
import {
  calcularCostoReceta,
  calcularMargenGanancia,
  clasificarMargen,
} from '../../domain/services/calculadorCostos.ts';
import { Boton } from './Boton.tsx';

export interface ListaRecetasProps {
  productos: Producto[];
  cargando: boolean;
  error: string | null;
  gastoFijoPorcion?: number;
  onConfigurarGastoFijo?: () => void;
  onAbrirNuevoModal: () => void;
  onEditar?: (producto: Producto) => void;
  onEliminar?: (producto: Producto) => void;
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

const CATEGORIAS_FILTRO: (CategoriaProducto | 'Todas')[] = [
  'Todas',
  'Pastas Rellenas',
  'Pastas Lisas',
  'Empanadas',
  'Tartas',
  'Salsas',
];

/**
 * Componente mobile-first para visualización, filtrado y costeo de recetas.
 * Muestra precio, costo calculado (MP + Gasto Fijo), margen en $ y % y desglose de ingredientes.
 */
export const ListaRecetas: React.FC<ListaRecetasProps> = ({
  productos,
  cargando,
  error,
  gastoFijoPorcion = 0,
  onConfigurarGastoFijo,
  onAbrirNuevoModal,
  onEditar,
  onEliminar,
  onReintentar,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaProducto | 'Todas'>('Todas');
  const [recetasExpandidas, setRecetasExpandidas] = useState<Record<string, boolean>>({});

  const toggleExpandir = (id: string) => {
    setRecetasExpandidas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const coincideBusqueda =
        !busqueda.trim() ||
        producto.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) ||
        producto.ingredientes.some((ing) =>
          ing.nombreMateriaPrima.toLowerCase().includes(busqueda.trim().toLowerCase())
        );

      const coincideCategoria =
        categoriaSeleccionada === 'Todas' || producto.categoria === categoriaSeleccionada;

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoriaSeleccionada]);

  // Métricas globales para el banner de resumen
  const recetasConCosteo = useMemo(() => {
    return productos.filter((p) => p.ingredientes.length > 0 && p.precioLista > 0);
  }, [productos]);

  const margenPromedio = useMemo(() => {
    if (recetasConCosteo.length === 0) return null;
    const sumaMargenes = recetasConCosteo.reduce((acc, p) => {
      const costo = calcularCostoReceta(p.ingredientes, gastoFijoPorcion);
      const { margenPorcentaje } = calcularMargenGanancia(p.precioLista, costo);
      return acc + margenPorcentaje;
    }, 0);
    return Math.round((sumaMargenes / recetasConCosteo.length) * 10) / 10;
  }, [recetasConCosteo, gastoFijoPorcion]);

  if (cargando) {
    return (
      <div className="space-y-4 py-4" role="status" aria-label="Cargando recetas y costos">
        <div className="h-20 bg-stone-200/70 animate-pulse rounded-xl" />
        <div className="h-14 bg-stone-200/70 animate-pulse rounded-xl" />
        <div className="h-32 bg-stone-200/70 animate-pulse rounded-xl" />
        <div className="h-32 bg-stone-200/70 animate-pulse rounded-xl" />
        <span className="sr-only">Cargando recetas y costos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-marca-tomate/30 rounded-xl text-stone-900 space-y-3 my-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <p className="font-bold text-marca-tomate text-sm">Error al cargar recetas</p>
        </div>
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
    <section className="space-y-4" aria-label="Módulo de Recetas y Costeo">
      {/* Cabecera de módulo con estética de obrador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAF7EA]/95 border border-stone-200/80 p-4 sm:p-5 rounded-xl shadow-xs">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-marca-tomate text-white shadow-xs shrink-0">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </span>
          <div className="min-w-0 space-y-0.5">
            <span className="font-semibold text-xs uppercase tracking-wider text-marca-canela block">
              Fichas Técnicas & Obrador
            </span>
            <h2 className="font-titular text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Recetas y Costeo de Congelados
            </h2>
            <p className="text-xs text-stone-600">
              {productos.length} {productos.length === 1 ? 'receta registrada' : 'recetas registradas'} — Definición de ingredientes por porción y margen de ganancia en vivo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAbrirNuevoModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-marca-tomate hover:bg-marca-tomate/90 active:bg-marca-tomate/95 text-white font-bold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-sm"
          aria-label="Registrar nueva receta de producto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Nueva Receta</span>
        </button>
      </div>

      {/* Banner / Tarjeta de Gasto Fijo y Resumen del Obrador */}
      <div className="bg-[#FAF7EA]/95 border border-stone-200/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Costo Fijo por Porción */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Gasto Fijo por Porción:
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-white text-marca-canela border border-amber-300 shadow-2xs">
                {formatearMoneda(gastoFijoPorcion)} / porción
              </span>
              {onConfigurarGastoFijo && (
                <button
                  type="button"
                  onClick={onConfigurarGastoFijo}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-marca-canela transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50"
                  aria-label="Configurar gasto fijo por porción"
                >
                  Configurar
                </button>
              )}
            </div>
            <p className="text-xs text-stone-600">
              {gastoFijoPorcion > 0
                ? 'Amortización de gas, luz y estructura sumada al costo de cada plato.'
                : 'Sin costo fijo configurado. Tocá en configurar para amortizar servicios y alquiler.'}
            </p>
          </div>
        </div>

        {/* Resumen de Métricas Globales */}
        <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-stone-200/80 md:pl-4">
          <div className="text-left md:text-center px-2">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Recetas Activas
            </span>
            <span className="font-titular text-lg font-bold text-stone-900">
              {productos.length}
            </span>
          </div>

          <div className="text-left md:text-center px-2 border-l border-stone-200/80">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Margen Promedio
            </span>
            <span
              className={`font-titular text-lg font-bold ${
                margenPromedio === null
                  ? 'text-stone-400'
                  : margenPromedio >= 30
                  ? 'text-emerald-700'
                  : 'text-marca-tomate'
              }`}
            >
              {margenPromedio !== null ? `${margenPromedio}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda rápida */}
      <div className="relative">
        <label htmlFor="buscador-recetas" className="sr-only">
          Buscar receta o ingrediente
        </label>
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          id="buscador-recetas"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar receta o ingrediente (ej. Raviolones, Espinaca, Ricotta...)"
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/95 text-stone-900 border border-stone-200/80 placeholder-stone-400 shadow-2xs transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:border-transparent disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Filtro por Categorías Mobile-First */}
      <div
        className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none"
        role="group"
        aria-label="Filtrar por categoría"
      >
        {CATEGORIAS_FILTRO.map((cat) => {
          const seleccionada = categoriaSeleccionada === cat;
          const cantidadEnCategoria =
            cat === 'Todas'
              ? productos.length
              : productos.filter((p) => p.categoria === cat).length;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaSeleccionada(cat)}
              className={`px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                seleccionada
                  ? 'bg-marca-tomate text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300'
              }`}
              aria-pressed={seleccionada}
            >
              {cat} ({cantidadEnCategoria})
            </button>
          );
        })}
      </div>

      {/* Listado de Recetas o Estado Vacío */}
      {productosFiltrados.length === 0 ? (
        <div className="text-center py-10 px-4 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/80 shadow-xs">
          <img
            src={busqueda || categoriaSeleccionada !== 'Todas' ? '/personajes/Recurso 10.svg' : '/personajes/Recurso 9.svg'}
            alt="Ilustración decorativa de cocina"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 opacity-90 object-contain"
          />
          <p className="text-stone-900 font-bold text-base">
            {busqueda || categoriaSeleccionada !== 'Todas'
              ? 'No se encontraron recetas con los filtros aplicados'
              : 'Todavía no hay recetas registradas'}
          </p>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {busqueda || categoriaSeleccionada !== 'Todas'
              ? 'Probá modificando o limpiando los criterios de búsqueda para encontrar lo que buscás.'
              : 'Estandarizá las fichas técnicas del obrador vinculando tus ingredientes con precios de lista para costear pastas, empanadas y tartas al instante.'}
          </p>
          {busqueda || categoriaSeleccionada !== 'Todas' ? (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setCategoriaSeleccionada('Todas');
              }}
              className="mt-4 px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela"
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              type="button"
              onClick={onAbrirNuevoModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:bg-marca-tomate/95 text-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Cargar primera receta</span>
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3.5" role="list">
          {productosFiltrados.map((producto) => {
            const tieneIngredientes = producto.ingredientes.length > 0;
            const costoMP = tieneIngredientes
              ? calcularCostoReceta(producto.ingredientes, 0)
              : 0;
            const costoProduccion = tieneIngredientes
              ? calcularCostoReceta(producto.ingredientes, gastoFijoPorcion)
              : 0;
            const { margenPesos, margenPorcentaje } = calcularMargenGanancia(
              producto.precioLista,
              costoProduccion
            );
            const estadoMargen = clasificarMargen(
              margenPorcentaje,
              margenPesos,
              tieneIngredientes ? costoProduccion : 0,
              producto.precioLista
            );
            const expandida = Boolean(recetasExpandidas[producto.id]);
            const unidadVentaLegible =
              producto.unidadVenta === 'Porcion' ? 'Porción' : producto.unidadVenta;

            // Precio de venta sugerido (+40% de margen estándar)
            const precioSugerido =
              costoProduccion > 0 ? Math.round((costoProduccion / 0.6) * 100) / 100 : 0;

            return (
              <li
                key={producto.id}
                className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow space-y-3.5"
              >
                {/* Cabecera del Producto */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                        {producto.categoria}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">
                        • Rinde: 1 {unidadVentaLegible}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">
                        • {producto.ingredientes.length}{' '}
                        {producto.ingredientes.length === 1 ? 'insumo' : 'insumos'}
                      </span>
                    </div>
                    <h3 className="font-titular font-bold text-stone-900 text-lg sm:text-xl leading-snug">
                      {producto.nombre}
                    </h3>
                  </div>

                  {/* Acciones de Edición y Baja con los 5 estados obligatorios */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    {onEditar && (
                      <button
                        type="button"
                        onClick={() => onEditar(producto)}
                        aria-label={`Editar receta ${producto.nombre}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-marca-canela bg-stone-100 hover:bg-stone-200 active:bg-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Editar
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        type="button"
                        onClick={() => onEliminar(producto)}
                        aria-label={`Eliminar receta ${producto.nombre}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-marca-tomate bg-red-50 hover:bg-red-100 active:bg-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                {/* Métricas Financieras (Precio, Desglose de Costo, Margen) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAF7EA]/80 rounded-xl border border-stone-200/70 text-left">
                  {/* Precio Venta */}
                  <div className="space-y-0.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Precio Venta ({unidadVentaLegible})
                    </span>
                    <div className="font-titular text-xl sm:text-2xl font-bold text-marca-tomate">
                      {formatearMoneda(producto.precioLista)}
                    </div>
                    {tieneIngredientes && precioSugerido > 0 && (
                      <span className="text-[11px] text-stone-500 block">
                        Sugerido (+40%): {formatearMoneda(precioSugerido)}
                      </span>
                    )}
                  </div>

                  {/* Desglose de Costos: MP + Gasto Fijo = Costo Total */}
                  <div className="space-y-0.5 sm:border-x sm:border-stone-200/80 sm:px-3">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Costo Total por {unidadVentaLegible}
                    </span>
                    {tieneIngredientes ? (
                      <>
                        <div className="font-titular text-lg sm:text-xl font-bold text-stone-800">
                          {formatearMoneda(costoProduccion)}
                        </div>
                        <span className="text-[11px] text-stone-500 block">
                          {formatearMoneda(costoMP)} MP + {formatearMoneda(gastoFijoPorcion)} fijo
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 block mt-1">
                        Sin insumos cargados
                      </span>
                    )}
                  </div>

                  {/* Margen de Ganancia */}
                  <div className="space-y-0.5 sm:pl-2">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Margen de Ganancia
                    </span>
                    {tieneIngredientes ? (
                      <>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-titular text-lg sm:text-xl font-bold text-stone-900">
                            {formatearMoneda(margenPesos)}
                          </span>
                          <span className="text-xs font-semibold text-stone-600">
                            ({margenPorcentaje}%)
                          </span>
                        </div>
                        <div className="pt-0.5">
                          {estadoMargen === 'SALUDABLE' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#C0D873]/50 text-[#304000] border border-[#C0D873]">
                              {margenPorcentaje >= 60 ? 'Alto' : 'Saludable'}
                            </span>
                          )}
                          {estadoMargen === 'ADVERTENCIA' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-marca-otono border border-marca-otono/30">
                              Ajustado
                            </span>
                          )}
                          {estadoMargen === 'PERDIDA' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-marca-tomate border border-marca-tomate/30">
                              En Pérdida
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-stone-500 block mt-1">
                        Sin costear
                      </span>
                    )}
                  </div>
                </div>

                {/* Semáforo de Margen / Alertas */}
                {!tieneIngredientes && (
                  <div
                    role="status"
                    className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg"
                  >
                    <span>⚠️ Receta sin insumos cargados. Editá para asignar los ingredientes y calcular el costo.</span>
                  </div>
                )}

                {tieneIngredientes && estadoMargen === 'PERDIDA' && (
                  <div
                    role="status"
                    className="flex items-center gap-2 text-xs font-semibold text-marca-tomate bg-red-50 border border-marca-tomate/30 px-3 py-2 rounded-lg"
                  >
                    <span>⚠️ ¡Alerta! El costo de producción supera el precio de venta.</span>
                  </div>
                )}

                {tieneIngredientes && estadoMargen === 'ADVERTENCIA' && (
                  <div
                    role="status"
                    className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg"
                  >
                    <span>Margen ajustado (menor al 30%). Conviene revisar precios de lista o costos.</span>
                  </div>
                )}

                {/* Botón para expandir/colapsar desglose de ingredientes */}
                {producto.ingredientes.length > 0 && (
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleExpandir(producto.id)}
                      aria-expanded={expandida}
                      className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-semibold text-marca-canela hover:text-stone-900 active:text-stone-950 px-2 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-150 ${expandida ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>
                        {expandida
                          ? 'Ocultar fórmula de receta'
                          : `Ver fórmula de receta (${producto.ingredientes.length} ${
                              producto.ingredientes.length === 1 ? 'insumo' : 'insumos'
                            })`}
                      </span>
                    </button>

                    {expandida && (
                      <div className="mt-2 pl-3 border-l-2 border-marca-canela/40 space-y-2 text-xs bg-stone-50/70 p-3 rounded-lg">
                        <div className="text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1">
                          Insumos por 1 {unidadVentaLegible}
                        </div>
                        {producto.ingredientes.map((ing) => {
                          const subtotal = ing.cantidad * ing.costoUnitario;
                          return (
                            <div
                              key={ing.id || ing.materiaPrimaId}
                              className="flex justify-between items-center py-1 border-b border-stone-200/50 last:border-0"
                            >
                              <div>
                                <span className="font-semibold text-stone-800">
                                  {ing.nombreMateriaPrima}
                                </span>
                                <span className="text-stone-500 ml-1.5">
                                  ({ing.cantidad} {ing.unidadMedida} a {formatearMoneda(ing.costoUnitario)}/{ing.unidadMedida})
                                </span>
                              </div>
                              <span className="font-semibold text-stone-900">
                                {formatearMoneda(subtotal)}
                              </span>
                            </div>
                          );
                        })}

                        <div className="flex justify-between items-center pt-1.5 border-t border-stone-200 font-medium text-stone-700">
                          <span>Subtotal materias primas</span>
                          <span>{formatearMoneda(costoMP)}</span>
                        </div>

                        {gastoFijoPorcion > 0 && (
                          <div className="flex justify-between items-center py-1.5 px-2 bg-amber-50 rounded border border-amber-200/70 text-amber-900 font-medium">
                            <span className="flex items-center gap-1">
                              <span>💡</span> Gasto fijo por porción
                            </span>
                            <span className="font-bold">+{formatearMoneda(gastoFijoPorcion)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-1 font-bold text-stone-900 border-t border-stone-300">
                          <span>Costo Total Elaboración</span>
                          <span className="text-sm font-bold text-marca-tomate">{formatearMoneda(costoProduccion)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
