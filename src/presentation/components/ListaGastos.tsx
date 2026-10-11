import React, { useState, useMemo } from 'react';
import {
  Gasto,
  ResumenGastos,
  CategoriaGastoFiltro,
  MetodoPagoGasto,
} from '../../domain/models/gasto.ts';
import { filtrarGastos } from '../../domain/services/gastoServicio.ts';
import { Boton } from './Boton.tsx';

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
function formatearFecha(fechaStr: string): string {
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

  const estiloInput =
    'w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ' +
    'focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:cursor-not-allowed ' +
    'min-h-[44px] transition-colors';

  if (cargando && gastos.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-stone-200 rounded-2xl" />
        <div className="h-10 bg-stone-200 rounded-xl" />
        <div className="space-y-3">
          <div className="h-20 bg-stone-200 rounded-xl" />
          <div className="h-20 bg-stone-200 rounded-xl" />
          <div className="h-20 bg-stone-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && gastos.length === 0) {
    return (
      <div className="p-6 bg-red-50 border border-marca-tomate/40 rounded-2xl text-center space-y-3">
        <p className="text-sm font-bold text-marca-tomate">
          No pudimos cargar los datos de gastos
        </p>
        <p className="text-xs text-stone-600">{error}</p>
        <Boton variante="primario" tamano="mediano" onClick={onReintentar}>
          Reintentar conexión
        </Boton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Métricas Financieras de Egresos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Total Egresos
          </span>
          <span className="text-sm sm:text-base font-bold text-marca-tomate block mt-0.5">
            ${resumen.totalGastos.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">
            {resumen.cantidadGastos} {resumen.cantidadGastos === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Materia Prima
          </span>
          <span className="text-sm sm:text-base font-bold text-amber-700 block mt-0.5">
            ${resumen.totalMateriaPrima.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">Insumos y comida</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Operativos y Fijos
          </span>
          <span className="text-sm sm:text-base font-bold text-stone-800 block mt-0.5">
            ${resumen.totalOperativos.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">Servicios y packaging</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Por Vía de Pago
          </span>
          <div className="text-[11px] font-bold text-stone-800 mt-1 space-y-0.5">
            <div className="text-emerald-700 truncate">
              💵 Efec: ${resumen.totalEfectivo.toLocaleString('es-AR')}
            </div>
            <div className="text-blue-700 truncate">
              💳 Transf: ${resumen.totalTransferencia.toLocaleString('es-AR')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barra de acciones y búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1">
          <label htmlFor="input-buscar-gastos" className="sr-only">
            Buscar gastos por concepto o detalle
          </label>
          <input
            id="input-buscar-gastos"
            name="buscarGastos"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por concepto o detalle..."
            className={estiloInput}
            aria-label="Buscar gastos por concepto"
          />
          {busqueda && (
            <button
              type="button"
              disabled={cargando}
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:bg-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <Boton
          variante="primario"
          tamano="mediano"
          onClick={onAbrirNuevoGasto}
          className="w-full sm:w-auto"
        >
          + Nuevo Gasto
        </Boton>
      </div>

      {/* 3. Filtros por Categoría y Método de Pago */}
      <div className="space-y-2">
        {/* Chips de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIAS_FILTRO.map((cat) => {
            const activo = categoriaFiltro === cat;
            return (
              <button
                key={cat}
                type="button"
                disabled={cargando}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  activo
                    ? 'bg-marca-canela text-white border-marca-canela shadow-xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Chips de Método de Pago */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">Método:</span>
          {(['Todos', 'Efectivo', 'Transferencia'] as const).map((metodo) => {
            const activo = metodoFiltro === metodo;
            return (
              <button
                key={metodo}
                type="button"
                disabled={cargando}
                onClick={() => setMetodoFiltro(metodo)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  activo
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100'
                }`}
              >
                {metodo === 'Todos' ? 'Todos' : metodo === 'Efectivo' ? '💵 Efectivo' : '💳 Transf.'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Lista de Gastos */}
      {gastosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-2">
          <span className="text-3xl block">📋</span>
          <h3 className="text-sm font-bold text-stone-800">
            {gastos.length === 0
              ? 'Aún no registraste ningún gasto'
              : 'No se encontraron gastos con esos filtros'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {gastos.length === 0
              ? 'Anotá tus compras de harinas, packaging o facturas de servicios para llevar el control real de tu negocio.'
              : 'Probá cambiando la categoría, método de pago o borrando el texto de búsqueda.'}
          </p>
          {gastos.length === 0 && (
            <div className="pt-2">
              <Boton variante="primario" tamano="chico" onClick={onAbrirNuevoGasto}>
                + Cargar primer gasto
              </Boton>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {gastosFiltrados.map((gasto) => {
            const badgeCategoria = {
              'Materia Prima': 'bg-amber-50 text-amber-800 border-amber-200',
              Packaging: 'bg-orange-50 text-orange-800 border-orange-200',
              Servicios: 'bg-blue-50 text-blue-800 border-blue-200',
              Equipamiento: 'bg-purple-50 text-purple-800 border-purple-200',
              Otros: 'bg-stone-50 text-stone-700 border-stone-200',
            }[gasto.categoria];

            return (
              <div
                key={gasto.id}
                className="bg-white p-3.5 rounded-xl border border-stone-200 hover:border-stone-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Lado izquierdo: Info y detalle */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-500">
                      {formatearFecha(gasto.fecha)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeCategoria}`}
                    >
                      {gasto.categoria}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                        gasto.metodoPago === 'Efectivo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {gasto.metodoPago === 'Efectivo' ? '💵 Efectivo' : '💳 Transferencia'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 truncate">
                    {gasto.concepto}
                  </h4>

                  {/* Impacto en stock de materia prima */}
                  {gasto.compraMateriaPrima && (
                    <div className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/60 rounded-md px-2 py-1 inline-flex flex-wrap items-center gap-1.5">
                      <span>📦 Insumo actualizado:</span>
                      <span className="font-semibold">
                        +{gasto.compraMateriaPrima.cantidadComprada}{' '}
                        {gasto.compraMateriaPrima.unidadMedida}
                      </span>
                      {gasto.compraMateriaPrima.nuevoCostoUnitario && (
                        <span>
                          (a ${gasto.compraMateriaPrima.nuevoCostoUnitario}/
                          {gasto.compraMateriaPrima.unidadMedida})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Lado derecho: Monto y Acción de Anular */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-stone-400 block sm:hidden">Monto:</span>
                    <span className="text-base sm:text-lg font-bold text-marca-tomate">
                      -${gasto.monto.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={cargando}
                    onClick={() => onEliminarGasto(gasto)}
                    aria-label={`Anular gasto ${gasto.concepto}`}
                    className="px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:text-marca-tomate hover:bg-red-50 active:bg-red-100 rounded-lg border border-transparent hover:border-red-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anular
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
