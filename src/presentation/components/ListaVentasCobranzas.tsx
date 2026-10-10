import React, { useState, useMemo } from 'react';
import { Venta, EstadoCobranza } from '../../domain/models/venta.ts';
import { Cliente } from '../../domain/models/cliente.ts';
import { ResumenFinancieroVentas } from '../../domain/models/venta.ts';
import { Boton } from './Boton.tsx';

export interface ListaVentasCobranzasProps {
  ventas: Venta[];
  clientes: Cliente[];
  resumen: ResumenFinancieroVentas;
  cargando: boolean;
  error: string | null;
  onAbrirNuevaVenta: () => void;
  onAbrirNuevoCliente: () => void;
  onCobrarDeuda: (cliente: Cliente) => void;
  onAnularVenta: (venta: Venta) => void;
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

/**
 * Limpia el número de teléfono para generar enlace de WhatsApp.
 */
function limpiarTelefonoWhatsapp(tel: string): string {
  const soloNumeros = tel.replace(/\D/g, '');
  if (soloNumeros.startsWith('549')) return soloNumeros;
  if (soloNumeros.startsWith('54')) return `549${soloNumeros.slice(2)}`;
  if (soloNumeros.startsWith('15')) return `54911${soloNumeros.slice(2)}`;
  if (soloNumeros.length === 10) return `549${soloNumeros}`;
  return `549${soloNumeros}`;
}

export const ListaVentasCobranzas: React.FC<ListaVentasCobranzasProps> = ({
  ventas,
  clientes,
  resumen,
  cargando,
  error,
  onAbrirNuevaVenta,
  onAbrirNuevoCliente,
  onCobrarDeuda,
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
    'w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ' +
    'focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:cursor-not-allowed ' +
    'transition-colors';

  if (cargando && ventas.length === 0 && clientes.length === 0) {
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

  if (error && ventas.length === 0 && clientes.length === 0) {
    return (
      <div className="p-6 bg-red-50 border border-marca-tomate/40 rounded-2xl text-center space-y-3">
        <p className="text-sm font-bold text-marca-tomate">No pudimos cargar los datos de ventas</p>
        <p className="text-xs text-stone-600">{error}</p>
        <Boton variante="primario" tamano="mediano" onClick={onReintentar}>
          Reintentar conexión
        </Boton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Métricas de Mostrador */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Cobrado
          </span>
          <span className="text-sm sm:text-base font-bold text-[#446b1d] block mt-0.5">
            ${resumen.totalCobrado.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">Total en caja</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            En la Calle
          </span>
          <span
            className={`text-sm sm:text-base font-bold block mt-0.5 ${
              resumen.totalPendiente > 0 ? 'text-marca-tomate' : 'text-stone-700'
            }`}
          >
            ${resumen.totalPendiente.toLocaleString('es-AR')}
          </span>
          <span className="text-[10px] text-stone-400">Por cobrar</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block truncate">
            Deudores
          </span>
          <span className="text-sm sm:text-base font-bold text-stone-900 block mt-0.5">
            {resumen.clientesConDeuda}
          </span>
          <span className="text-[10px] text-stone-400">
            {resumen.clientesConDeuda === 1 ? 'cliente' : 'clientes'}
          </span>
        </div>
      </div>

      {/* 2. Barra de acciones y pestañas internas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Selector de sub-solapas */}
        <div className="flex bg-stone-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSubSolapa('ventas')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
              subSolapa === 'ventas'
                ? 'bg-white text-marca-canela shadow-xs'
                : 'text-stone-600 hover:text-stone-900 active:bg-stone-300/60'
            }`}
          >
            Ventas Recientes ({ventas.length})
          </button>
          <button
            type="button"
            onClick={() => setSubSolapa('clientes')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
              subSolapa === 'clientes'
                ? 'bg-white text-marca-canela shadow-xs'
                : 'text-stone-600 hover:text-stone-900 active:bg-stone-300/60'
            }`}
          >
            Clientes y Deudas ({clientes.length})
          </button>
        </div>

        {/* Botón de acción según sub-solapa */}
        <div className="flex gap-2">
          {subSolapa === 'clientes' && (
            <Boton
              variante="secundario"
              tamano="mediano"
              onClick={onAbrirNuevoCliente}
              className="flex-1 sm:flex-none"
            >
              + Nuevo Cliente
            </Boton>
          )}
          <Boton
            variante="primario"
            tamano="mediano"
            onClick={onAbrirNuevaVenta}
            className="flex-1 sm:flex-none"
          >
            + Nueva Venta
          </Boton>
        </div>
      </div>

      {/* 3. VISTA: Ventas Recientes */}
      {subSolapa === 'ventas' && (
        <div className="space-y-3">
          {/* Barra de búsqueda y filtros de estado */}
          <div className="space-y-2">
            <label htmlFor="input-busqueda-ventas" className="sr-only">
              Buscar ventas por cliente, plato o fecha
            </label>
            <input
              id="input-busqueda-ventas"
              name="busquedaVentas"
              aria-label="Buscar ventas por cliente, plato o fecha"
              type="text"
              placeholder="Buscar por cliente, plato o fecha..."
              value={busquedaVenta}
              onChange={(e) => setBusquedaVenta(e.target.value)}
              className={estiloInput}
            />

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {(
                [
                  { id: 'todas', label: 'Todas' },
                  { id: 'Cobrado', label: 'Cobrado' },
                  { id: 'Pendiente', label: 'Pendiente' },
                  { id: 'Regalo', label: 'Regalo' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroEstadoVenta(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all whitespace-nowrap min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                    filtroEstadoVenta === f.id
                      ? 'bg-marca-canela text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 active:bg-stone-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de ventas */}
          {ventasFiltradas.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center space-y-2">
              <span className="text-3xl">🧾</span>
              <p className="text-sm font-bold text-stone-800">No hay ventas registradas</p>
              <p className="text-xs text-stone-500">
                {busquedaVenta || filtroEstadoVenta !== 'todas'
                  ? 'Probá ajustando la búsqueda o el filtro de estado.'
                  : 'Registrá tu primera venta de mostrador con el botón "+ Nueva Venta".'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {ventasFiltradas.map((venta) => (
                <div
                  key={venta.id}
                  className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs hover:border-stone-300 transition-all space-y-2"
                >
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {venta.nombreCliente || 'Cliente Mostrador'}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {formatearFecha(venta.fecha)}
                        </span>
                      </div>

                      {/* Badge de estado y método */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {venta.estadoPago === 'Cobrado' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-100 text-[#446b1d] border border-lime-300">
                            ✓ Cobrado ({venta.metodoPago === 'Transferencia' ? '📱 Transf.' : '💵 Efectivo'})
                          </span>
                        )}
                        {venta.estadoPago === 'Pendiente' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#a0461c] border border-orange-300">
                            ⏳ Pendiente de cobro
                          </span>
                        )}
                        {venta.estadoPago === 'Regalo' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                            🎁 Regalo / Degustación
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Importe total y botón anular */}
                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-bold text-stone-900 block">
                        ${venta.total.toLocaleString('es-AR')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAnularVenta(venta)}
                        title="Anular venta y restituir stock"
                        aria-label={`Anular venta de ${venta.nombreCliente} del ${formatearFecha(venta.fecha)}`}
                        className="text-[11px] text-stone-400 hover:text-marca-tomate active:underline transition-colors mt-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca-tomate rounded px-1"
                      >
                        Anular
                      </button>
                    </div>
                  </div>

                  {/* Detalle de productos */}
                  <div className="pt-2 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                    {venta.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="text-stone-700 truncate pr-2">
                          {it.cantidad} {it.unidadVenta || 'u'} &times; {it.nombreProducto}
                        </span>
                        <span className="text-stone-500 shrink-0">
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

      {/* 4. VISTA: Clientes y Deudas */}
      {subSolapa === 'clientes' && (
        <div className="space-y-3">
          {/* Barra de búsqueda y filtro de deuda */}
          <div className="space-y-2">
            <label htmlFor="input-busqueda-clientes" className="sr-only">
              Buscar cliente por nombre o teléfono
            </label>
            <input
              id="input-busqueda-clientes"
              name="busquedaClientes"
              aria-label="Buscar cliente por nombre o teléfono"
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className={estiloInput}
            />

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'conDeuda', label: 'Con Deuda' },
                  { id: 'alDia', label: 'Al Día ($0)' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroDeudaCliente(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all whitespace-nowrap min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                    filtroDeudaCliente === f.id
                      ? 'bg-marca-canela text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 active:bg-stone-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de clientes */}
          {clientesFiltrados.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center space-y-2">
              <span className="text-3xl">👥</span>
              <p className="text-sm font-bold text-stone-800">No se encontraron clientes</p>
              <p className="text-xs text-stone-500">
                {busquedaCliente || filtroDeudaCliente !== 'todos'
                  ? 'Probá ajustando la búsqueda o el filtro.'
                  : 'Agregá un cliente con el botón "+ Nuevo Cliente" arriba.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {clientesFiltrados.map((cliente) => {
                const tieneDeuda = cliente.saldoPendiente > 0;
                const linkWhatsapp = cliente.telefono
                  ? `https://wa.me/${limpiarTelefonoWhatsapp(cliente.telefono)}`
                  : null;

                return (
                  <div
                    key={cliente.id}
                    className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs hover:border-stone-300 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {cliente.nombreApellido}
                      </h4>

                      {/* Teléfono y WhatsApp */}
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        {cliente.telefono ? (
                          <>
                            <span className="text-stone-500">{cliente.telefono}</span>
                            {linkWhatsapp && (
                              <a
                                href={linkWhatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline font-semibold flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600 rounded px-0.5"
                                title="Enviar mensaje de WhatsApp"
                              >
                                💬 WhatsApp
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-stone-400 italic">Sin teléfono</span>
                        )}
                      </div>

                      {/* Badge de saldo */}
                      <div className="mt-1.5">
                        {tieneDeuda ? (
                          <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-marca-tomate border border-red-200">
                            Debe ${cliente.saldoPendiente.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            Al día ($0)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón para cobrar si tiene deuda */}
                    {tieneDeuda && (
                      <div className="shrink-0">
                        <Boton
                          variante="primario"
                          tamano="chico"
                          onClick={() => onCobrarDeuda(cliente)}
                        >
                          Cobrar
                        </Boton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
