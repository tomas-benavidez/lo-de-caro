import React, { useState, useMemo } from 'react';
import { Venta, EstadoCobranza } from '../../domain/models/venta.ts';
import { Cliente } from '../../domain/models/cliente.ts';
import { ResumenFinancieroVentas } from '../../domain/models/venta.ts';

export interface ListaVentasCobranzasProps {
  ventas: Venta[];
  clientes: Cliente[];
  resumen: ResumenFinancieroVentas;
  cargando: boolean;
  error: string | null;
  onAbrirNuevaVenta: () => void;
  onAbrirNuevoCliente: () => void;
  onCobrarDeuda: (cliente: Cliente) => void;
  onEditarCliente?: (cliente: Cliente) => void;
  onEliminarCliente?: (cliente: Cliente) => void;
  onAnularVenta: (venta: Venta) => void;
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

/**
 * Limpia el número de teléfono para generar enlace de WhatsApp.
 */
export function limpiarTelefonoWhatsapp(tel: string): string {
  const soloNumeros = tel.replace(/\D/g, '');
  if (soloNumeros.startsWith('549')) return soloNumeros;
  if (soloNumeros.startsWith('54')) return `549${soloNumeros.slice(2)}`;
  if (soloNumeros.startsWith('15')) return `54911${soloNumeros.slice(2)}`;
  if (soloNumeros.length === 10) return `549${soloNumeros}`;
  return `549${soloNumeros}`;
}

/**
 * Componente rediseñado de Ventas y Cobranzas de Mostrador según la especificación Stitch
 * ("Warm Tactile Minimalism" para Lo de Caro).
 * Incluye KPIs de caja y mostrador, pastillas táctiles de navegación, fichas de ventas con desglose
 * de productos y medios de pago, tarjetas de clientes con WhatsApp directo y cobranza rápida de deudas,
 * y estados vacíos ilustrados.
 */
export const ListaVentasCobranzas: React.FC<ListaVentasCobranzasProps> = ({
  ventas,
  clientes,
  resumen,
  cargando,
  error,
  onAbrirNuevaVenta,
  onAbrirNuevoCliente,
  onCobrarDeuda,
  onEditarCliente,
  onEliminarCliente,
  onAnularVenta,
  onReintentar,
}) => {
  const [subSolapa, setSubSolapa] = useState<'ventas' | 'clientes'>('ventas');
  const [filtroEstadoVenta, setFiltroEstadoVenta] = useState<'todas' | EstadoCobranza>('todas');
  const [busquedaVenta, setBusquedaVenta] = useState('');

  const [filtroDeudaCliente, setFiltroDeudaCliente] = useState<'todos' | 'conDeuda' | 'alDia'>('todos');
  const [busquedaCliente, setBusquedaCliente] = useState('');

  // Filtrado de ventas
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      const coincideEstado =
        filtroEstadoVenta === 'todas' || v.estadoPago === filtroEstadoVenta;

      const termino = busquedaVenta.trim().toLowerCase();
      const coincideTermino =
        !termino ||
        (v.nombreCliente && v.nombreCliente.toLowerCase().includes(termino)) ||
        v.items.some((it) => it.nombreProducto.toLowerCase().includes(termino)) ||
        v.fecha.includes(termino);

      return coincideEstado && coincideTermino;
    });
  }, [ventas, filtroEstadoVenta, busquedaVenta]);

  // Filtrado de clientes
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const coincideDeuda =
        filtroDeudaCliente === 'todos' ||
        (filtroDeudaCliente === 'conDeuda' && c.saldoPendiente > 0) ||
        (filtroDeudaCliente === 'alDia' && c.saldoPendiente <= 0);

      const termino = busquedaCliente.trim().toLowerCase();
      const coincideTermino =
        !termino ||
        c.nombreApellido.toLowerCase().includes(termino) ||
        (c.telefono && c.telefono.includes(termino));

      return coincideDeuda && coincideTermino;
    });
  }, [clientes, filtroDeudaCliente, busquedaCliente]);

  const estiloInput =
    'w-full bg-white/95 border border-stone-300 rounded-lg p-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ' +
    'focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:cursor-not-allowed ' +
    'shadow-2xs transition-colors';

  if (cargando && ventas.length === 0 && clientes.length === 0) {
    return (
      <div className="space-y-4 py-4" role="status" aria-label="Cargando ventas y clientes">
        <div className="h-16 bg-white/70 backdrop-blur-sm animate-pulse rounded-xl border border-stone-200/50" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-24 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        </div>
        <div className="h-12 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        <div className="space-y-3">
          <div className="h-28 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-28 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
          <div className="h-28 bg-white/70 animate-pulse rounded-xl border border-stone-200/50" />
        </div>
        <span className="sr-only">Cargando ventas y cuentas corrientes...</span>
      </div>
    );
  }

  if (error && ventas.length === 0 && clientes.length === 0) {
    return (
      <div
        role="alert"
        className="p-5 bg-red-50/90 border border-marca-tomate/30 rounded-xl text-stone-900 space-y-3 my-4 shadow-sm text-center"
      >
        <div className="flex items-center justify-center gap-2 text-marca-tomate font-semibold text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>No pudimos cargar los datos de ventas y cobranzas</span>
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
    <section className="space-y-5" aria-label="Módulo de Ventas y Cobranzas de Mostrador">
      {/* 4.a Cabecera de módulo con ícono de mostrador, subtítulo artesanal, título de alto impacto y botones de acción */}
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
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs uppercase tracking-wider font-semibold">
              Caja, Despacho &amp; Clientes
            </span>
          </div>
          <h2 className="font-titular text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Ventas y Cobranzas de Mostrador
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Salida de congelados listos, pedidos de freezer y cobro al cliente en tiempo real
          </p>
        </div>

        {/* Botones de acción con los 5 estados obligatorios */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onAbrirNuevoCliente}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border-2 border-marca-canela text-marca-canela hover:bg-marca-canela/10 active:bg-marca-canela/20 active:scale-[0.98] font-bold text-xs sm:text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-2 focus-visible:ring-offset-marca-beige disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Registrar nuevo cliente"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>+ Nuevo Cliente</span>
          </button>

          <button
            type="button"
            onClick={onAbrirNuevaVenta}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2 focus-visible:ring-offset-marca-beige disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Registrar nueva venta de mostrador"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Nueva Venta</span>
          </button>
        </div>
      </div>

      {/* 4.b Barra de 3 Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* KPI 1: Total Facturado */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Total Facturado
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
              {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
            </span>
          </div>
          <div>
            <span className="font-titular text-2xl sm:text-3xl font-bold text-stone-900 block leading-tight">
              ${resumen.totalVentas.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Operaciones registradas en mostrador
            </span>
          </div>
        </div>

        {/* KPI 2: Total Cobrado (en verde lima #C0D873 / #465800) */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Total Cobrado
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#465800] bg-marca-lima/40 px-2.5 py-0.5 rounded-full border border-marca-lima/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#465800]" />
              En Caja
            </span>
          </div>
          <div>
            <span className="font-titular text-2xl sm:text-3xl font-bold text-[#465800] block leading-tight">
              ${resumen.totalCobrado.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Ingresado en efectivo y transferencia
            </span>
          </div>
        </div>

        {/* KPI 3: Deuda Pendiente / Cta Corriente (en naranja hoja de otoño #E56B31) */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-stone-200/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Deuda Pendiente / Cta Corriente
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                resumen.totalPendiente > 0
                  ? 'text-[#E56B31] bg-orange-100 border border-orange-200'
                  : 'text-stone-600 bg-stone-100'
              }`}
            >
              {resumen.totalPendiente > 0 ? 'En la Calle' : 'Al Día'}
            </span>
          </div>
          <div>
            <span
              className={`font-titular text-2xl sm:text-3xl font-bold block leading-tight ${
                resumen.totalPendiente > 0 ? 'text-[#E56B31]' : 'text-stone-700'
              }`}
            >
              ${resumen.totalPendiente.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              {resumen.clientesConDeuda}{' '}
              {resumen.clientesConDeuda === 1 ? 'cliente con saldo deudor' : 'clientes con saldo deudor'}
            </span>
          </div>
        </div>
      </div>

      {/* 4.c Selector de sub-solapas en pastillas táctiles con 5 estados */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Pestañas de ventas y clientes"
          className="inline-flex p-1.5 bg-stone-200/80 backdrop-blur-sm rounded-xl self-start gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subSolapa === 'ventas'}
            onClick={() => setSubSolapa('ventas')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[42px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1 disabled:opacity-50 cursor-pointer ${
              subSolapa === 'ventas'
                ? 'bg-marca-tomate text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-white/70 active:bg-stone-300/60'
            }`}
          >
            Ventas Realizadas ({ventas.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subSolapa === 'clientes'}
            onClick={() => setSubSolapa('clientes')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[42px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1 disabled:opacity-50 cursor-pointer ${
              subSolapa === 'clientes'
                ? 'bg-marca-tomate text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-white/70 active:bg-stone-300/60'
            }`}
          >
            Clientes &amp; Cuentas Corrientes ({clientes.length})
          </button>
        </div>

        {/* Indicador de freezer sincronizado */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-marca-canela font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Stock de freezer sincronizado con cada venta</span>
        </div>
      </div>

      {/* 4.d VISTA: Ventas Realizadas */}
      {subSolapa === 'ventas' && (
        <div className="space-y-4">
          {/* Barra de búsqueda y filtros táctiles de cobranza */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <label htmlFor="input-busqueda-ventas" className="sr-only">
                Buscar ventas por cliente, plato o fecha
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="input-busqueda-ventas"
                name="busquedaVentas"
                aria-label="Buscar ventas por cliente, plato o fecha"
                type="text"
                placeholder="Buscar por cliente, plato o fecha..."
                value={busquedaVenta}
                onChange={(e) => setBusquedaVenta(e.target.value)}
                className={`${estiloInput} pl-10`}
              />
            </div>

            {/* Chips de filtro de estado con 5 estados UI */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              {(
                [
                  { id: 'todas', label: `Todas (${ventas.length})` },
                  { id: 'Cobrado', label: `Cobrado (${ventas.filter((v) => v.estadoPago === 'Cobrado').length})` },
                  { id: 'Pendiente', label: `Pendiente (${ventas.filter((v) => v.estadoPago === 'Pendiente').length})` },
                  { id: 'Regalo', label: `Regalo (${ventas.filter((v) => v.estadoPago === 'Regalo').length})` },
                ] as const
              ).map((f) => {
                const activo = filtroEstadoVenta === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroEstadoVenta(f.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all whitespace-nowrap min-h-[36px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 cursor-pointer ${
                      activo
                        ? 'bg-marca-canela text-white shadow-xs'
                        : 'bg-white/90 text-stone-600 border border-stone-200/80 hover:border-stone-300 hover:text-stone-900 hover:bg-white active:bg-stone-100'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listado de ventas o estado vacío ilustrado */}
          {ventasFiltradas.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/80 shadow-xs space-y-3">
              <img
                src={busquedaVenta || filtroEstadoVenta !== 'todas' ? '/personajes/Recurso 10.svg' : '/personajes/Recurso 11.svg'}
                alt="Ilustración decorativa de mostrador"
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto opacity-90 object-contain"
              />
              <p className="text-stone-900 font-bold text-base">
                {busquedaVenta || filtroEstadoVenta !== 'todas'
                  ? 'No se encontraron ventas con los filtros aplicados'
                  : 'Todavía no hay ventas registradas en el mostrador'}
              </p>
              <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
                {busquedaVenta || filtroEstadoVenta !== 'todas'
                  ? 'Probá ajustando la búsqueda por cliente o cambiando el filtro de cobranza.'
                  : 'Despachá congelados listos, cobrá en efectivo o transferencia y mantené el stock al día.'}
              </p>
              {busquedaVenta || filtroEstadoVenta !== 'todas' ? (
                <button
                  type="button"
                  onClick={() => {
                    setBusquedaVenta('');
                    setFiltroEstadoVenta('todas');
                  }}
                  className="inline-flex items-center justify-center font-semibold rounded-lg px-3.5 py-1.5 text-xs text-marca-canela border border-marca-canela/40 hover:bg-marca-canela/10 active:bg-marca-canela/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela cursor-pointer"
                >
                  Limpiar filtros
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onAbrirNuevaVenta}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate cursor-pointer"
                >
                  + Nueva Venta
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {ventasFiltradas.map((venta) => (
                <div
                  key={venta.id}
                  className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow space-y-3"
                >
                  {/* Fila principal: Cliente, Fecha, Badges, Total y Anular */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-titular text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                          {venta.nombreCliente || 'Cliente Mostrador (Ocasional)'}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                          <svg className="w-3.5 h-3.5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatearFecha(venta.fecha)}</span>
                        </div>
                      </div>

                      {/* Badges de Estado de Cobranza y Medio de Pago */}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {/* Estado de Cobranza */}
                        {venta.estadoPago === 'Cobrado' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-marca-lima/30 text-[#465800] border border-marca-lima/60">
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Cobrado
                          </span>
                        )}
                        {venta.estadoPago === 'Pendiente' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#E56B31] border border-orange-200">
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pendiente / Fiado
                          </span>
                        )}
                        {venta.estadoPago === 'Regalo' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            <span>🎁</span>
                            Regalo / Degustación
                          </span>
                        )}

                        {/* Medio de Pago */}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200/60">
                          {venta.metodoPago === 'Transferencia' ? '📱 Transferencia' : '💵 Efectivo'}
                        </span>
                      </div>
                    </div>

                    {/* Total y Botón Anular con 5 estados */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <span className="font-titular text-xl sm:text-2xl font-bold text-marca-tomate leading-none">
                        ${venta.total.toLocaleString('es-AR')}
                      </span>

                      <button
                        type="button"
                        onClick={() => onAnularVenta(venta)}
                        title="Anular venta y restituir stock al freezer"
                        aria-label={`Anular venta de ${venta.nombreCliente || 'Cliente Mostrador'} del ${formatearFecha(venta.fecha)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-stone-400 hover:text-marca-tomate hover:bg-red-50/80 active:bg-red-100 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Anular venta</span>
                      </button>
                    </div>
                  </div>

                  {/* Desglose de ítems vendidos */}
                  <div className="bg-[#FAF7EA]/90 rounded-lg p-3 border border-stone-200/50 space-y-1.5">
                    {venta.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-stone-700">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-marca-canela shrink-0" />
                          <span className="truncate">
                            <strong className="font-semibold text-stone-900">{it.cantidad} {it.unidadVenta || 'u'}</strong> &times; {it.nombreProducto}
                          </span>
                        </div>
                        <span className="font-semibold text-stone-900 shrink-0">
                          ${it.subtotal.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4.e VISTA: Clientes & Cuentas Corrientes */}
      {subSolapa === 'clientes' && (
        <div className="space-y-4">
          {/* Barra de búsqueda y filtros de deuda */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <label htmlFor="input-busqueda-clientes" className="sr-only">
                Buscar cliente por nombre o teléfono
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="input-busqueda-clientes"
                name="busquedaClientes"
                aria-label="Buscar cliente por nombre o teléfono"
                type="text"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className={`${estiloInput} pl-10`}
              />
            </div>

            {/* Chips de filtro de deuda con 5 estados UI */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              {(
                [
                  { id: 'todos', label: `Todos (${clientes.length})` },
                  { id: 'conDeuda', label: `Con Deuda (${clientes.filter((c) => c.saldoPendiente > 0).length})` },
                  { id: 'alDia', label: `Al Día ($0) (${clientes.filter((c) => c.saldoPendiente <= 0).length})` },
                ] as const
              ).map((f) => {
                const activo = filtroDeudaCliente === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroDeudaCliente(f.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all whitespace-nowrap min-h-[36px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 cursor-pointer ${
                      activo
                        ? 'bg-marca-canela text-white shadow-xs'
                        : 'bg-white/90 text-stone-600 border border-stone-200/80 hover:border-stone-300 hover:text-stone-900 hover:bg-white active:bg-stone-100'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listado de clientes o estado vacío ilustrado */}
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200/80 shadow-xs space-y-3">
              <img
                src={busquedaCliente || filtroDeudaCliente !== 'todos' ? '/personajes/Recurso 11.svg' : '/personajes/Recurso 10.svg'}
                alt="Ilustración decorativa de clientes"
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto opacity-90 object-contain"
              />
              <p className="text-stone-900 font-bold text-base">
                {busquedaCliente || filtroDeudaCliente !== 'todos'
                  ? 'No se encontraron clientes con los filtros aplicados'
                  : 'Todavía no hay clientes registrados en la libreta'}
              </p>
              <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
                {busquedaCliente || filtroDeudaCliente !== 'todos'
                  ? 'Probá buscando con otro nombre o ajustando el filtro de cuentas corrientes.'
                  : 'Agregá clientes habituales para fiar pedidos, registrar cobros y llevar el saldo al día.'}
              </p>
              {busquedaCliente || filtroDeudaCliente !== 'todos' ? (
                <button
                  type="button"
                  onClick={() => {
                    setBusquedaCliente('');
                    setFiltroDeudaCliente('todos');
                  }}
                  className="inline-flex items-center justify-center font-semibold rounded-lg px-3.5 py-1.5 text-xs text-marca-canela border border-marca-canela/40 hover:bg-marca-canela/10 active:bg-marca-canela/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela cursor-pointer"
                >
                  Limpiar filtros
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onAbrirNuevoCliente}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-marca-tomate hover:bg-marca-tomate/90 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate cursor-pointer"
                >
                  + Nuevo Cliente
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {clientesFiltrados.map((cliente) => {
                const tieneDeuda = cliente.saldoPendiente > 0;
                const linkWhatsapp = cliente.telefono
                  ? `https://wa.me/${limpiarTelefonoWhatsapp(cliente.telefono)}`
                  : null;

                return (
                  <div
                    key={cliente.id}
                    className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-titular text-base sm:text-lg font-bold text-stone-900 tracking-tight truncate">
                          {cliente.nombreApellido}
                        </h4>

                        {/* Saldo deudor destacado */}
                        {tieneDeuda ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-marca-tomate border border-red-200">
                            Debe ${cliente.saldoPendiente.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-marca-lima/30 text-[#465800] border border-marca-lima/50">
                            Al día ($0)
                          </span>
                        )}
                      </div>

                      {/* Teléfono y Enlace Directo a WhatsApp con 5 estados */}
                      <div className="flex items-center gap-3 text-xs">
                        {cliente.telefono ? (
                          <>
                            <span className="text-stone-600 font-medium">{cliente.telefono}</span>
                            {linkWhatsapp && (
                              <a
                                href={linkWhatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
                                title={`Enviar mensaje de WhatsApp a ${cliente.nombreApellido}`}
                              >
                                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.772.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm3.376 8.21c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.12-.519-1.822-.756-3.003-2.607-3.095-2.73-.09-.123-.74-1.002-.74-1.91 0-.909.477-1.354.646-1.538.17-.184.37-.23.493-.23.123 0 .247.001.355.006.113.006.264-.043.413.315.153.37.525 1.28.571 1.373.047.093.078.201.016.324-.062.123-.093.2-.185.308-.092.108-.194.241-.277.324-.092.093-.189.194-.082.378.108.185.478.788 1.026 1.276.706.63 1.3.825 1.485.918.185.092.293.077.401-.047.108-.123.463-.539.587-.724.123-.185.247-.154.416-.092.169.062 1.08.509 1.266.601.185.093.308.139.354.216.046.077.046.447-.098.852z" />
                                </svg>
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-stone-400 italic">Sin teléfono registrado</span>
                        )}
                      </div>
                    </div>

                    {/* Acciones de cliente con 5 estados */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      {tieneDeuda && (
                        <button
                          type="button"
                          onClick={() => onCobrarDeuda(cliente)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          aria-label={`Registrar cobro o pago de ${cliente.nombreApellido}`}
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>Registrar Cobro</span>
                        </button>
                      )}

                      {onEditarCliente && (
                        <button
                          type="button"
                          onClick={() => onEditarCliente(cliente)}
                          aria-label={`Editar cliente ${cliente.nombreApellido}`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 hover:border-stone-400 active:bg-stone-200 active:scale-[0.98] font-semibold text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Editar</span>
                        </button>
                      )}

                      {onEliminarCliente && (
                        <button
                          type="button"
                          onClick={() => onEliminarCliente(cliente)}
                          aria-label={`Eliminar cliente ${cliente.nombreApellido}`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-stone-400 hover:text-marca-tomate hover:bg-red-50 active:bg-red-100 active:scale-[0.98] font-semibold text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
