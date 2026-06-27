'use client';

import React, { useState, useTransition } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { registrarVenta } from '@/infrastructure/actions/ventas';

interface Props {
  productos: any[];
  clientes: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MostradorVentas({ productos, clientes, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [carrito, setCarrito] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [estadoCobro, setEstadoCobro] = useState<'Cobrada' | 'Pendiente'>('Cobrada');
  const [error, setError] = useState<string | null>(null);

  // Add product to cart
  const agregarAlCarrito = (prod: any) => {
    setCarrito(prev => {
      const exist = prev.find(item => item.producto_id === prod.id);
      if (exist) {
        return prev.map(item => item.producto_id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, {
        producto_id: prod.id,
        nombre: prod.nombre,
        precio_cobrado_real: Number(prod.precio_lista),
        cantidad: 1
      }];
    });
  };

  const cambiarCantidad = (prodId: string, delta: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.producto_id === prodId) {
        const nuevaCant = item.cantidad + delta;
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio_cobrado_real * item.cantidad), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (carrito.length === 0) {
      setError('El carrito está vacío.');
      return;
    }

    if (estadoCobro === 'Pendiente' && !clienteId) {
      setError('Las ventas pendientes de cobro requieren asociar un Cliente obligatoriamente.');
      return;
    }

    startTransition(async () => {
      try {
        await registrarVenta(
          clienteId || null as any, // If paid, client can be null
          estadoCobro,
          null as any, // Supabase trigger resolves registered_by or admits null
          carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_cobrado_real: item.precio_cobrado_real
          }))
        );
        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Error al registrar venta.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 p-4 animate-in slide-in-from-bottom duration-200">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-lg text-slate-100">Nueva Venta</h3>
          <p className="text-xs text-slate-500">Toca los productos para cargarlos a la venta</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2.5 rounded-full bg-slate-800 text-slate-500 hover:text-slate-100 min-w-[48px] min-h-[48px] flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Two sections: Grid of products (top) and Cart/Checkout (bottom) */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {productos.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            No hay productos registrados para vender.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {productos.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => agregarAlCarrito(prod)}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between text-left h-28 focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95 transition min-h-[48px]"
              >
                <span className="font-bold text-sm text-slate-200 line-clamp-2">{prod.nombre}</span>
                <span className="text-primary font-black text-base mt-2">${Number(prod.precio_lista).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Checkout and Cart Summary */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800 pt-4 space-y-4 bg-slate-950">
        {/* Cart Items */}
        {carrito.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
            {carrito.map((item) => (
              <div key={item.producto_id} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 truncate flex-1">{item.nombre}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => cambiarCantidad(item.producto_id, -1)} 
                    className="p-2 rounded bg-slate-800 text-slate-400 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-bold text-slate-100 w-6 text-center">{item.cantidad}</span>
                  <button 
                    type="button" 
                    onClick={() => agregarAlCarrito({ id: item.producto_id, nombre: item.nombre, precio_lista: item.precio_cobrado_real })} 
                    className="p-2 rounded bg-slate-800 text-slate-400 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-extrabold text-success-verde w-16 text-right ml-1">
                    ${(item.precio_cobrado_real * item.amount || item.precio_cobrado_real * item.cantidad).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="block w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:outline-none min-h-[44px]"
            >
              <option value="">-- Consumidor Final --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre_apellido}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estado</label>
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 min-h-[44px]">
              <button
                type="button"
                onClick={() => setEstadoCobro('Cobrada')}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition min-h-[32px] ${
                  estadoCobro === 'Cobrada' ? 'bg-success-verde text-white' : 'text-slate-500'
                }`}
              >
                Cobrada
              </button>
              <button
                type="button"
                onClick={() => setEstadoCobro('Pendiente')}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition min-h-[32px] ${
                  estadoCobro === 'Pendiente' ? 'bg-accent text-slate-950' : 'text-slate-500'
                }`}
              >
                Deuda
              </button>
            </div>
          </div>
        </div>

        {error && <div className="text-xs text-danger-rojo font-bold">{error}</div>}

        {/* Final totals */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-slate-400">Total Venta:</span>
          <span className="text-2xl font-black text-success-verde">${totalCarrito.toFixed(2)}</span>
        </div>

        <button
          type="submit"
          disabled={isPending || carrito.length === 0}
          className="flex w-full justify-center items-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-white shadow-md hover:bg-primary/95 disabled:opacity-50 transition min-h-[48px]"
        >
          <ShoppingCart className="h-5 w-5" />
          {isPending ? 'Confirmando...' : estadoCobro === 'Cobrada' ? 'Cobrar Venta' : 'Registrar como Deuda'}
        </button>
      </form>
    </div>
  );
}
