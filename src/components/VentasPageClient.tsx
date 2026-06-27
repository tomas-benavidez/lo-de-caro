'use client';

import React, { useState } from 'react';
import { ShoppingCart, Calendar, User, DollarSign, Plus } from 'lucide-react';
import MostradorVentas from './MostradorVentas';

interface Props {
  inicialVentas: any[];
  productos: any[];
  clientes: any[];
}

export default function VentasPageClient({ inicialVentas, productos, clientes }: Props) {
  const [ventas, setVentas] = useState<any[]>(inicialVentas);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes'>('todas');
  const [mostrarTPV, setMostrarTPV] = useState(false);

  const handleVentaRegistrada = () => {
    window.location.reload();
  };

  const ventasFiltradas = ventas.filter((v) => {
    if (filtro === 'pendientes') {
      return v.estado_cobro === 'Pendiente';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Big Action button to launch TPV */}
      <button
        onClick={() => setMostrarTPV(true)}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 px-6 rounded-2xl font-bold shadow-md hover:bg-primary/95 transition min-h-[54px] text-base"
      >
        <Plus className="h-5 w-5 text-white" />
        <span>Abrir Terminal de Ventas</span>
      </button>

      {/* Tabs Filter */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setFiltro('todas')}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition min-h-[40px] ${
            filtro === 'todas' ? 'bg-slate-800 text-slate-100' : 'text-slate-500'
          }`}
        >
          Todas las Ventas
        </button>
        <button
          onClick={() => setFiltro('pendientes')}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition min-h-[40px] ${
            filtro === 'pendientes' ? 'bg-accent/15 text-accent border border-accent/20' : 'text-slate-500'
          }`}
        >
          Cuentas Pendientes (Deudores)
        </button>
      </div>

      {/* Sales list */}
      <div className="space-y-4">
        {ventasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            No se encontraron ventas para este filtro.
          </div>
        ) : (
          ventasFiltradas.map((venta) => {
            const total = venta.venta_items?.reduce(
              (sum: number, item: any) => sum + (Number(item.precio_cobrado_real) * item.cantidad),
              0
            ) || 0;
            const clienteNombre = venta.clientes?.nombre_apellido || 'Consumidor Final';

            return (
              <div key={venta.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base flex items-center gap-1.5">
                      <User className="h-4.5 w-4.5 text-slate-400" />
                      {clienteNombre}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{venta.fecha}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-success-verde block">
                      ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 ${
                        venta.estado_cobro === 'Cobrada'
                          ? 'bg-success-verde/10 border border-success-verde/20 text-success-verde'
                          : 'bg-accent/10 border border-accent/20 text-accent'
                      }`}
                    >
                      {venta.estado_cobro}
                    </span>
                  </div>
                </div>

                {/* Items detail list */}
                {venta.venta_items && venta.venta_items.length > 0 && (
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
                    <div className="grid grid-cols-1 gap-1">
                      {venta.venta_items.map((item: any) => {
                        const nombreProducto = item.productos?.nombre || 'Producto';
                        return (
                          <div
                            key={item.id}
                            className="flex justify-between text-xs text-slate-400 border-b border-slate-900 last:border-b-0 py-1"
                          >
                            <span>
                              {nombreProducto} <span className="text-slate-500 font-normal">x{item.cantidad}</span>
                            </span>
                            <span className="font-semibold text-slate-200">
                              ${(Number(item.precio_cobrado_real) * item.amount || Number(item.precio_cobrado_real) * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {mostrarTPV && (
        <MostradorVentas
          productos={productos}
          clientes={clientes}
          onClose={() => setMostrarTPV(false)}
          onSuccess={handleVentaRegistrada}
        />
      )}
    </div>
  );
}
