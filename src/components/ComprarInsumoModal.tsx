'use client';

import React, { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Insumo } from '@/domain/insumo';
import { registrarCompraInsumo } from '@/infrastructure/actions/insumos';

interface Props {
  insumo: Insumo;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export default function ComprarInsumoModal({ insumo, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pVal = Number(precio);
    const cVal = Number(cantidad);

    if (isNaN(pVal) || pVal <= 0 || isNaN(cVal) || cVal <= 0) {
      setError('El precio y la cantidad deben ser números positivos.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await registrarCompraInsumo(insumo.id, pVal, cVal);
        onSuccess(res);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al guardar.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-100">Registrar Compra</h3>
            <p className="text-xs text-slate-500 mt-0.5">{insumo.nombre}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-full bg-slate-800 text-slate-500 hover:text-slate-100 min-w-[48px] min-h-[48px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              Cantidad Comprada ({insumo.unidad_medida})
            </label>
            <input
              type="number"
              step="any"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder={`Cantidad en ${insumo.unidad_medida}`}
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              Precio Total Pagado ($)
            </label>
            <input
              type="number"
              step="any"
              required
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Total pagado en esta compra"
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
            />
          </div>

          {error && (
            <div className="text-sm text-danger-rojo font-semibold">{error}</div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center items-center rounded-xl bg-primary py-4 text-base font-bold text-white shadow-md hover:bg-primary/95 disabled:opacity-50 transition min-h-[48px]"
          >
            {isPending ? 'Guardando...' : 'Confirmar Compra'}
          </button>
        </form>
      </div>
    </div>
  );
}
