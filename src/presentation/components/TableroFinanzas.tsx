import React, { useState, useMemo } from 'react';
import { Venta } from '../../domain/models/venta.ts';
import { Gasto } from '../../domain/models/gasto.ts';
import { configuracionRepositorio } from '../../infrastructure/repositories/configuracionRepositorio.ts';
import {
  obtenerMesesDisponibles,
  formatearMesLegible,
  calcularResumenFinancieroPeriodo,
} from '../../domain/services/finanzaServicio.ts';
import { Boton } from './Boton.tsx';
import { ModalEditarMetaMensual } from './ModalEditarMetaMensual.tsx';

export interface TableroFinanzasProps {
  ventas: Venta[];
  gastos: Gasto[];
}

export const TableroFinanzas: React.FC<TableroFinanzasProps> = ({ ventas, gastos }) => {
  const mesActualDelSistema = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Metas personalizadas guardadas por mes
  const metasPorMes = useMemo(() => configuracionRepositorio.obtenerMetasPorMes(), []);

  // Generar meses recientes (mes actual + últimos 5 meses) para que Caro siempre pueda consultar cómo le fue en meses anteriores
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

  return (
    <section className="space-y-4" aria-label="Módulo de Finanzas y Balance">
      {/* Cabecera y Filtro de Selección de Mes */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 leading-tight">
              Balance y Control Financiero
            </h2>
            <p className="text-xs text-stone-500">
              Consultá el rendimiento de cualquier mes o el histórico acumulado
            </p>
          </div>

          {/* Selector accesible de período */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="selector-periodo-finanzas"
              className="text-xs font-semibold text-stone-700 whitespace-nowrap"
            >
              Período:
            </label>
            <select
              id="selector-periodo-finanzas"
              value={periodoSeleccionado}
              onChange={(e) => handleCambiarPeriodo(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-800 hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors"
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
        <div className="flex items-center gap-2 text-xs text-stone-600 bg-marca-beige/40 px-3 py-1.5 rounded-lg border border-stone-200/60">
          <span className="inline-block w-2 h-2 rounded-full bg-marca-canela" />
          <span>
            Mostrando resultados de:{' '}
            <strong className="text-stone-900 font-bold">{resumen.etiquetaPeriodo}</strong>
          </span>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero Real */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Ingresos Cobrados */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Ingresos Cobrados
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-700 block mt-0.5">
            ${resumen.totalCobrado.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">Ventas cobradas</span>
        </div>

        {/* Gastos Totales */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Gastos Totales
          </span>
          <span className="text-base sm:text-lg font-bold text-marca-tomate block mt-0.5">
            ${resumen.totalGastos.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">Egresos registrados</span>
        </div>

        {/* Ganancia Neta Real */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Ganancia Neta Real
          </span>
          <span
            className={`text-base sm:text-lg font-bold block mt-0.5 ${
              resumen.gananciaNeta >= 0 ? 'text-[#446b1d]' : 'text-marca-tomate'
            }`}
          >
            ${resumen.gananciaNeta.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">Ingresos - Gastos</span>
        </div>

        {/* Margen Global */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Margen Global
          </span>
          <span
            className={`text-base sm:text-lg font-bold block mt-0.5 ${
              resumen.margenPorcentaje >= 30
                ? 'text-[#446b1d]'
                : resumen.margenPorcentaje > 0
                ? 'text-amber-700'
                : 'text-marca-tomate'
            }`}
          >
            {resumen.margenPorcentaje}%
          </span>
          <span className="text-[10px] text-stone-400">Sobre ingresos</span>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Ticket Promedio
          </span>
          <span className="text-base sm:text-lg font-bold text-stone-800 block mt-0.5">
            ${resumen.ticketPromedio.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">Por venta cobrada</span>
        </div>

        {/* Total de Ventas */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Operaciones
          </span>
          <span className="text-base sm:text-lg font-bold text-stone-800 block mt-0.5">
            {resumen.totalVentas}
          </span>
          <span className="text-[10px] text-stone-400 block truncate">
            {resumen.totalPendiente > 0
              ? `$${resumen.totalPendiente.toLocaleString('es-AR')} a cobrar`
              : 'Ventas en el período'}
          </span>
        </div>
      </div>

      {/* Termómetro de Meta de Retiro Personal Editable */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-800 block">
                {periodoSeleccionado === 'TODOS'
                  ? 'Meta Mensual de Referencia'
                  : 'Meta de Retiro Personal de Caro'}
              </span>
              <span className="text-[10px] bg-marca-canela/10 text-marca-canela font-bold px-1.5 py-0.5 rounded">
                {resumen.etiquetaPeriodo}
              </span>
            </div>
            <span className="text-[11px] text-stone-500">
              {periodoSeleccionado === 'TODOS'
                ? 'Objetivo mensual base de sueldo para contrastar con el acumulado'
                : 'Sueldo mensual objetivo editable para este período'}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm sm:text-base font-bold text-marca-canela">
              ${resumen.metaRetiro.toLocaleString('es-AR')} / mes
            </span>
            <Boton
              type="button"
              variante="secundario"
              tamano="chico"
              onClick={() => setModalEditarMetaAbierto(true)}
              aria-label={`Editar meta mensual para ${resumen.etiquetaPeriodo}`}
              className="py-1 px-2.5 text-xs"
            >
              Cambiar Objetivo
            </Boton>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-stone-100 rounded-full h-3.5 overflow-hidden border border-stone-200">
          <div
            className={`h-3.5 rounded-full transition-all duration-300 ${
              metaCumplida ? 'bg-emerald-600' : 'bg-marca-canela'
            }`}
            style={{ width: `${resumen.porcentajeMeta}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-stone-600">
          <span>
            Progreso:{' '}
            <strong className={metaCumplida ? 'text-emerald-700' : 'text-stone-800'}>
              {resumen.porcentajeMeta}%
            </strong>{' '}
            alcanzado
          </span>
          <span>
            {metaCumplida ? (
              <span className="font-bold text-emerald-700">
                {periodoSeleccionado === 'TODOS'
                  ? '¡Objetivo superado en el histórico! 🎉'
                  : '¡Meta mensual alcanzada! 🎉'}
              </span>
            ) : (
              <>
                Faltan:{' '}
                <strong>${resumen.faltaParaMeta.toLocaleString('es-AR')}</strong>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Sección con Ranking de Productos Más Vendidos y Desglose de Gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ranking de Productos Más Vendidos */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Top Productos Más Vendidos
              </h3>
              <p className="text-[11px] text-stone-500">
                Ranking por unidades y facturación ({resumen.etiquetaPeriodo})
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-400">
              {resumen.topProductos.length} {resumen.topProductos.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {resumen.topProductos.length === 0 ? (
            <div className="py-6 text-center text-stone-400 text-xs">
              No hay ventas registradas en este período.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Destacado del Producto Más Vendido */}
              <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-center justify-between text-xs text-amber-950">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 font-extrabold truncate">
                    <span>🏆 Más Vendido:</span>
                    <span className="text-amber-900 truncate">{resumen.topProductos[0].nombreProducto}</span>
                  </div>
                  <span className="text-[11px] text-amber-800 block">
                    {resumen.topProductos[0].unidadesVendidas} {resumen.topProductos[0].unidadVenta || 'unid'} elaboradas y vendidas
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-800 block">
                    ${resumen.topProductos[0].facturacionTotal.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] text-stone-500">Facturación</span>
                </div>
              </div>

              {resumen.topProductos.map((prod, index) => (
                <div
                  key={prod.productoId}
                  className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100 hover:border-stone-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-800 block truncate">
                          {prod.nombreProducto}
                        </span>
                        {index === 0 && (
                          <span className="text-[9px] bg-amber-200/90 text-amber-900 font-extrabold px-1.5 py-0.2 rounded shrink-0">
                            Top 1
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 block">
                        {prod.unidadesVendidas} {prod.unidadVenta || 'unid'} vendidas
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-800 block">
                      ${prod.facturacionTotal.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-stone-400">Facturado</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desglose de Gastos por Categoría */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Desglose de Gastos por Rubro
              </h3>
              <p className="text-[11px] text-stone-500">
                Distribución de egresos ({resumen.etiquetaPeriodo})
              </p>
            </div>
            <span className="text-xs font-bold text-marca-tomate">
              ${resumen.totalGastos.toLocaleString('es-AR')}
            </span>
          </div>

          {resumen.desgloseGastos.length === 0 ? (
            <div className="py-6 text-center text-stone-400 text-xs">
              No hay gastos registrados en este período.
            </div>
          ) : (
            <div className="space-y-2.5">
              {resumen.desgloseGastos.map((gasto) => (
                <div key={gasto.categoria} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-700">{gasto.categoria}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900">
                        ${gasto.monto.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-1.5 py-0.2 rounded">
                        {gasto.porcentaje}%
                      </span>
                    </div>
                  </div>
                  {/* Barra proporcional */}
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
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
