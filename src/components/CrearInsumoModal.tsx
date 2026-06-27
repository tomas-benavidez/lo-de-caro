'use client';

import React, { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { createInsumo } from '@/infrastructure/actions/insumos';

interface Props {
  onClose: () => void;
  onSuccess: (newInsumo: any) => void;
}

export default function CrearInsumoModal({ onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState('');
  const [unidadMedida, setUnidadMedida] = useState<'g' | 'ml' | 'u'>('g');
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre es requerido.');
      return;
    }

    const sActual = Number(stockActual);
    const sMinimo = stockMinimo ? Number(stockMinimo) : undefined;

    if (isNaN(sActual) || sActual < 0) {
      setError('El stock actual debe ser un número mayor o igual a 0.');
      return;
    }

    if (sMinimo !== undefined && (isNaN(sMinimo) || sMinimo < 0)) {
      setError('El stock mínimo debe ser un número mayor o igual a 0.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createInsumo({
          nombre: nombre.trim(),
          unidad_medida: unidadMedida,
          stock_actual: sActual,
          stock_minimo: sMinimo,
        });
        onSuccess(res);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error al crear el insumo.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-100">Nuevo Insumo</h3>
            <p className="text-xs text-slate-400 mt-0.5">Crear insumo o envase en la alacena</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-danger-rojo/10 p-3 text-sm border border-danger-rojo/20 text-danger-rojo font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nombre del Insumo
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Harina 0000, Envase Empanadas, etc."
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Unidad de Medida
            </label>
            <select
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value as 'g' | 'ml' | 'u')}
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
            >
              <option value="g">Gramos (g)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="u">Unidades (u)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Stock Inicial
              </label>
              <input
                type="number"
                step="any"
                required
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                placeholder="0"
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Stock Mínimo
              </label>
              <input
                type="number"
                step="any"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                placeholder="Ej. 100"
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center items-center rounded-xl bg-primary px-4 py-3.5 text-base font-bold text-white shadow-md hover:bg-primary/95 focus:outline-none transition disabled:opacity-50 min-h-[48px]"
            >
              {isPending ? 'Guardando...' : 'Crear Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
