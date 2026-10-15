import React, { useState, useMemo } from 'react';
import { Venta } from '../../domain/models/venta.ts';
import { Gasto } from '../../domain/models/gasto.ts';
import { configuracionRepositorio } from '../../infrastructure/repositories/configuracionRepositorio.ts';
import {
  obtenerMesesDisponibles,
  formatearMesLegible,
  calcularResumenFinancieroPeriodo,
} from '../../domain/services/finanzaServicio.ts';
import { ModalEditarMetaMensual } from './ModalEditarMetaMensual.tsx';

export interface TableroFinanzasProps {
  ventas: Venta[];
  gastos: Gasto[];
}

/**
 * Tablero de Finanzas y Balance Mensual según la especificación Stitch
 * ("Warm Tactile Minimalism" para Lo de Caro).
 * Incluye cabecera con selector desplegable de mes en pastilla cálida, tarjetas maestras
 * de balance (Ventas Totales, Gastos Totales, Ganancia Neta Real destacada en verde lima #C0D873
 * o tomate #C13828 con números en Rubik), tarjeta de meta mensual con barra de progreso estética
 * y edición accesible, métricas de desempeño (ticket promedio, viandas/porciones despachadas, margen),
 * ranking estilizado de platos estrella con barras proporcionales, y elementos ilustrados de marca.
 */
export const TableroFinanzas: React.FC<TableroFinanzasProps> = ({ ventas, gastos }) => {
  const mesActualDelSistema = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Metas personalizadas guardadas por mes
  const metasPorMes = useMemo(() => configuracionRepositorio.obtenerMetasPorMes(), []);

  // Generar meses recientes (mes actual + últimos 5 meses)
  const mesesRecientes = useMemo(() => {
    const lista: string[] = [];
    const base = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      lista.push(`${yyyy}-${mm}`);
    }
    return lista;
  }, []);

  // Lista de meses disponibles ordenada descendentemente
  const mesesDisponibles = useMemo(
    () =>
      obtenerMesesDisponibles(
        ventas,
        gastos,
        mesActualDelSistema,
        [...Object.keys(metasPorMes), ...mesesRecientes]
      ),
    [ventas, gastos, mesActualDelSistema, metasPorMes, mesesRecientes]
  );

  // Período activo: por defecto el mes en curso
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>(mesActualDelSistema);

  // Meta editable persistida en almacenamiento resiliente
  const [metaRetiro, setMetaRetiro] = useState<number>(() =>
    configuracionRepositorio.obtenerMetaMensual(mesActualDelSistema)
  );

  const [modalEditarMetaAbierto, setModalEditarMetaAbierto] = useState(false);

  // Al cambiar el período, recargar la meta correspondiente
  const handleCambiarPeriodo = (nuevoPeriodo: string) => {
    setPeriodoSeleccionado(nuevoPeriodo);
    const metaDelPeriodo = configuracionRepositorio.obtenerMetaMensual(nuevoPeriodo);
    setMetaRetiro(metaDelPeriodo);
  };

  const handleGuardarNuevaMeta = (
    nuevoMonto: number,
    periodo: string,
    guardarComoDefault?: boolean
  ) => {
    configuracionRepositorio.guardarMetaMensual(nuevoMonto, periodo);
    if (guardarComoDefault && periodo !== 'TODOS') {
      configuracionRepositorio.guardarMetaMensual(nuevoMonto, 'TODOS');
    }
    setMetaRetiro(nuevoMonto);
  };

  // Resumen financiero recalculado en vivo según el período seleccionado
  const resumen = useMemo(
    () => calcularResumenFinancieroPeriodo(ventas, gastos, periodoSeleccionado, metaRetiro),
    [ventas, gastos, periodoSeleccionado, metaRetiro]
  );

  const metaCumplida = resumen.metaRetiro > 0 && resumen.gananciaNeta >= resumen.metaRetiro;

  // Total de unidades/porciones vendidas en el período
  const totalPorcionesDespachadas = useMemo(() => {
    return resumen.topProductos.reduce((acc, p) => acc + p.unidadesVendidas, 0);
  }, [resumen.topProductos]);

  // Máximo de unidades vendidas para normalizar las barras proporcionales
  const maxUnidadesVendidas = useMemo(() => {
    if (resumen.topProductos.length === 0) return 1;
    return Math.max(...resumen.topProductos.map((p) => p.unidadesVendidas), 1);
  }, [resumen.topProductos]);

  return (
    <section className="space-y-5" aria-label="Módulo de Finanzas y Balance Mensual">
      {/* 5.a Cabecera de módulo con selector desplegable de mes en pastilla cálida */}
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
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
            <span className="text-xs uppercase tracking-wider font-semibold">
              Rendimiento Económico del Obrador
            </span>
          </div>
          <h2 className="font-titular text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Balance Mensual &amp; Salud Financiera
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Monitoreo de ingresos por mostrador, costos operativos de cocina y ganancia real en tiempo real
          </p>
        </div>

        {/* Selector desplegable de mes en pastilla cálida */}
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-1.5 shadow-2xs self-start md:self-auto">
          <label
            htmlFor="selector-periodo-finanzas"
            className="text-xs font-semibold text-stone-700 whitespace-nowrap pl-1"
          >
            Período:
          </label>
          <select
            id="selector-periodo-finanzas"
            value={periodoSeleccionado}
            onChange={(e) => handleCambiarPeriodo(e.target.value)}
            className="bg-white border border-stone-300 rounded-md px-3 py-1.5 text-xs font-bold text-stone-800 hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <optgroup label="Meses">
              {mesesDisponibles.map((mes) => (
                <option key={mes} value={mes}>
                  {formatearMesLegible(mes)}
                  {mes === mesActualDelSistema ? ' (Mes Actual)' : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="General">
              <option value="TODOS">Histórico Completo</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Indicador de período activo */}
      <div className="flex items-center justify-between text-xs text-stone-600 bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-lg border border-stone-200/60 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-marca-canela animate-pulse" />
          <span>
            Mostrando resultados de:{' '}
            <strong className="text-stone-900 font-bold">{resumen.etiquetaPeriodo}</strong>
          </span>
        </div>
        <span className="text-[11px] text-stone-400 hidden sm:inline">
          {periodoSeleccionado === 'TODOS' ? 'Consolidado histórico' : 'Cierre mensual'}
        </span>
      </div>

      {/* 5.b Tarjetas de Balance: Ventas Totales, Gastos Totales y Ganancia Neta Real */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Tarjeta 1: Ventas Totales (ingresos brutos) */}
        <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Ventas Totales
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#465800] bg-marca-lima/40 px-2.5 py-0.5 rounded-full border border-marca-lima/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#465800]" />
              Ingresos
            </span>
          </div>
          <div>
            <span className="font-titular text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-700 block leading-tight">
              ${resumen.totalCobrado.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {resumen.totalPendiente > 0
                ? `+$${resumen.totalPendiente.toLocaleString('es-AR')} fiado / en la calle`
                : 'Totalmente cobrado en mostrador'}
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Gastos Totales (egresos acumulados) */}
        <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Gastos Totales
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-marca-tomate bg-red-100/70 px-2.5 py-0.5 rounded-full border border-red-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-marca-tomate" />
              Egresos
            </span>
          </div>
          <div>
            <span className="font-titular text-2xl sm:text-3xl lg:text-4xl font-bold text-marca-tomate block leading-tight">
              ${resumen.totalGastos.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Insumos, packaging y estructura
            </span>
          </div>
        </div>

        {/* Tarjeta 3: Ganancia Neta Real (destacada en caja con borde suave, verde lima #C0D873 o tomate #C13828) */}
        <div
          className={`bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-2 ${
            resumen.gananciaNeta >= 0
              ? 'border-[#C0D873] bg-[#C0D873]/10'
              : 'border-marca-tomate/60 bg-red-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Ganancia Neta Real
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                resumen.gananciaNeta >= 0
                  ? 'text-[#465800] bg-[#C0D873] border-[#a5bd56]'
                  : 'text-white bg-marca-tomate border-marca-tomate'
              }`}
            >
              {resumen.gananciaNeta >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          <div>
            <span
              className={`font-titular text-2xl sm:text-3xl lg:text-4xl font-bold block leading-tight ${
                resumen.gananciaNeta >= 0 ? 'text-[#465800]' : 'text-marca-tomate'
              }`}
            >
              {resumen.gananciaNeta < 0
                ? `-$${Math.abs(resumen.gananciaNeta).toLocaleString('es-AR')}`
                : `$${resumen.gananciaNeta.toLocaleString('es-AR')}`}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">
              Ingresos cobrados menos gastos totales
            </span>
          </div>
        </div>
      </div>

      {/* 5.c Tarjeta de Meta Mensual de Caro con Barra de Progreso y Edición */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/70 p-4 sm:p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-titular text-sm sm:text-base font-bold text-stone-900 block">
                {periodoSeleccionado === 'TODOS'
                  ? 'Meta Mensual de Referencia'
                  : 'Meta de Retiro Personal de Caro'}
              </span>
              <span className="text-[10px] bg-marca-canela/10 text-marca-canela font-bold px-2 py-0.5 rounded-full border border-marca-canela/20">
                {resumen.etiquetaPeriodo}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {periodoSeleccionado === 'TODOS'
                ? 'Objetivo mensual base de sueldo para contrastar con el acumulado'
                : 'Sueldo mensual objetivo para el bienestar y sustentabilidad de Caro'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="font-titular text-base sm:text-lg font-bold text-marca-canela">
              ${resumen.metaRetiro.toLocaleString('es-AR')} <span className="text-xs text-stone-500 font-normal">/ mes</span>
            </span>
            <button
              type="button"
              onClick={() => setModalEditarMetaAbierto(true)}
              aria-label={`Editar meta mensual para ${resumen.etiquetaPeriodo}`}
              className="inline-flex items-center justify-center font-semibold rounded-lg px-3 py-1.5 text-xs text-marca-canela border border-marca-canela/40 bg-white/90 hover:bg-marca-canela/10 hover:border-marca-canela active:bg-marca-canela/20 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1 focus-visible:ring-offset-marca-beige disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              Editar meta
            </button>
          </div>
        </div>

        {/* Barra de progreso estética hacia la meta */}
        <div className="w-full bg-stone-100 rounded-full h-3.5 sm:h-4 overflow-hidden border border-stone-200/80 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              metaCumplida ? 'bg-emerald-600' : 'bg-marca-canela'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, resumen.porcentajeMeta))}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs text-stone-600">
          <div>
            <span>Progreso hacia la meta: </span>
            <strong className={metaCumplida ? 'text-emerald-700 font-bold' : 'text-stone-900 font-bold'}>
              {resumen.porcentajeMeta}%
            </strong>{' '}
            alcanzado
          </div>
          <div>
            {metaCumplida ? (
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <span>¡Meta mensual alcanzada!</span> <span>🎉</span>
              </span>
            ) : (
              <span>
                Faltan para el objetivo:{' '}
                <strong className="text-stone-900 font-bold">
                  ${resumen.faltaParaMeta.toLocaleString('es-AR')}
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5.d Tarjetas de Desempeño: Ticket promedio, porciones despachadas y margen global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Ticket Promedio */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Ticket Promedio
            </span>
            <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded-full">
              Por orden
            </span>
          </div>
          <span className="font-titular text-xl sm:text-2xl font-bold text-stone-900 block leading-tight">
            ${resumen.ticketPromedio.toLocaleString('es-AR')}
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Valor medio por venta cobrada
          </span>
        </div>

        {/* Porciones & Viandas Despachadas */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Porciones Despachadas
            </span>
            <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded-full">
              Volumen
            </span>
          </div>
          <span className="font-titular text-xl sm:text-2xl font-bold text-stone-900 block leading-tight">
            {totalPorcionesDespachadas.toLocaleString('es-AR')}{' '}
            <span className="text-xs font-normal text-stone-500">unid.</span>
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">
            En {resumen.totalVentas} {resumen.totalVentas === 1 ? 'operación' : 'operaciones de mostrador'}
          </span>
        </div>

        {/* Margen Global */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Margen Global
            </span>
            <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded-full">
              % neto
            </span>
          </div>
          <span
            className={`font-titular text-xl sm:text-2xl font-bold block leading-tight ${
              resumen.margenPorcentaje >= 30
                ? 'text-emerald-700'
                : resumen.margenPorcentaje > 0
                ? 'text-amber-700'
                : 'text-marca-tomate'
            }`}
          >
            {resumen.margenPorcentaje}%
          </span>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Rentabilidad neta sobre ingresos
          </span>
        </div>
      </div>

      {/* 5.e Ranking de Productos Más Vendidos y Desglose de Gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ranking de Productos Más Vendidos */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/70 p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-titular text-base font-bold text-stone-900">
                Top Productos Más Vendidos
              </h3>
              <p className="text-xs text-stone-500">
                Ranking por unidades elaboradas y facturación ({resumen.etiquetaPeriodo})
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-400">
              {resumen.topProductos.length} {resumen.topProductos.length === 1 ? 'plato' : 'platos'}
            </span>
          </div>

          {resumen.topProductos.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <img
                src="/personajes/Recurso 7.svg"
                alt="Ilustración obrador sin ventas"
                className="w-16 h-16 mx-auto opacity-80 object-contain"
              />
              <p className="text-xs font-semibold text-stone-600">
                No hay ventas registradas en este período.
              </p>
              <p className="text-[11px] text-stone-400">
                Al asentar salidas en el mostrador verás acá el podio de recetas estrella.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Destacado del Producto Más Vendido (#1) */}
              <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-950 shadow-2xs">
                <div className="min-w-0 pr-2 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold truncate">
                    <span>🏆 Plato Estrella:</span>
                    <span className="text-amber-900 truncate font-titular">
                      {resumen.topProductos[0].nombreProducto}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-800 block">
                    {resumen.topProductos[0].unidadesVendidas}{' '}
                    {resumen.topProductos[0].unidadVenta || 'unid'} elaboradas y despachadas
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-titular text-sm font-bold text-emerald-800 block">
                    ${resumen.topProductos[0].facturacionTotal.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">Facturado</span>
                </div>
              </div>

              {/* Lista con barras proporcionales */}
              {resumen.topProductos.map((prod, index) => {
                const porcentajeBarra = Math.min(
                  100,
                  Math.round((prod.unidadesVendidas / maxUnidadesVendidas) * 100)
                );

                return (
                  <div
                    key={prod.productoId}
                    className="p-2.5 rounded-lg bg-stone-50/80 border border-stone-200/60 hover:border-stone-300 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            index === 0
                              ? 'bg-amber-200 text-amber-900 font-extrabold'
                              : index === 1
                              ? 'bg-stone-200 text-stone-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-stone-800 truncate">
                          {prod.nombreProducto}
                        </span>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className="text-[11px] text-stone-500">
                          {prod.unidadesVendidas} {prod.unidadVenta || 'unid'}
                        </span>
                        <span className="text-xs font-bold text-emerald-800">
                          ${prod.facturacionTotal.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>

                    {/* Barra proporcional de ventas */}
                    <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-marca-canela h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${porcentajeBarra}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desglose de Gastos por Categoría */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/70 p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-titular text-base font-bold text-stone-900">
                Desglose de Gastos por Rubro
              </h3>
              <p className="text-xs text-stone-500">
                Distribución de egresos ({resumen.etiquetaPeriodo})
              </p>
            </div>
            <span className="font-titular text-sm font-bold text-marca-tomate">
              ${resumen.totalGastos.toLocaleString('es-AR')}
            </span>
          </div>

          {resumen.desgloseGastos.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <img
                src="/personajes/Recurso 8.svg"
                alt="Ilustración obrador sin gastos"
                className="w-16 h-16 mx-auto opacity-80 object-contain"
              />
              <p className="text-xs font-semibold text-stone-600">
                No hay gastos registrados en este período.
              </p>
              <p className="text-[11px] text-stone-400">
                Registrá compras de ingredientes o costos de taller para ver el reparto.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumen.desgloseGastos.map((gasto) => (
                <div key={gasto.categoria} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-700">{gasto.categoria}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900">
                        ${gasto.monto.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-1.5 py-0.5 rounded-full">
                        {gasto.porcentaje}%
                      </span>
                    </div>
                  </div>
                  {/* Barra proporcional de gastos */}
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200/50">
                    <div
                      className="bg-marca-tomate h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, gasto.porcentaje)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5.f Sello Decorativo de Marca en el Pie */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-stone-200/70 shadow-2xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <img
          src="/personajes/Recurso 8.svg"
          alt="Sello de cocina artesanal Lo de Caro"
          className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 opacity-90 object-contain"
        />
        <div className="space-y-0.5">
          <h4 className="font-titular text-sm font-bold text-stone-900">
            Sustentabilidad y Costos en el Obrador
          </h4>
          <p className="text-xs text-stone-600 max-w-2xl">
            Controlar el margen neto y la ganancia real por encima de los costos de estructura asegura que cada horneada sea rentable, cuidando el precio justo para el cliente y el valor del tiempo de Caro.
          </p>
        </div>
      </div>

      {/* Modal accesible para editar la meta mensual */}
      <ModalEditarMetaMensual
        abierto={modalEditarMetaAbierto}
        periodo={periodoSeleccionado}
        valorActual={metaRetiro}
        onCerrar={() => setModalEditarMetaAbierto(false)}
        onGuardar={handleGuardarNuevaMeta}
      />
    </section>
  );
};
