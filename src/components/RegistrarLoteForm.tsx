'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { X } from 'lucide-react';
import { registrarLoteProduccion } from '@/infrastructure/actions/lotes';

interface Props {
  recetas: any[];
  insumos: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrarLoteForm({ recetas, insumos, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [recetaId, setRecetaId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [ingredientesConsumidos, setIngredientesConsumidos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Re-calculate theoretical ingredients when recipe or quantity changes
  useEffect(() => {
    if (!recetaId || !cantidad) {
      setIngredientesConsumidos([]);
      return;
    }

    const receta = recetas.find(r => r.id === recetaId);
    if (!receta) return;

    const cantidadProducida = Number(cantidad);
    if (isNaN(cantidadProducida) || cantidadProducida <= 0) return;

    // Base recipe is structured for receta.porciones_rendimiento (units)
    // Formula: Bruto = (Limpio / (1 - Merma/100)) * (Cantidad Producida / Rendimiento)
    const propuesta = receta.receta_ingredientes.map((ri: any) => {
      const ins = insumos.find(i => i.id === ri.insumo_id);
      const pesoLimpio = Number(ri.peso_limpio);
      const merma = Number(ri.porcentaje_merma || 0);

      const factorMerma = 1 - (merma / 100);
      const brutoUnitario = factorMerma > 0 ? pesoLimpio / factorMerma : pesoLimpio;
      const brutoTotalPropuesto = brutoUnitario * (cantidadProducida / Number(receta.porciones_rendimiento || 1));

      return {
        insumo_id: ri.insumo_id,
        nombre: ins?.nombre || 'Desconocido',
        unidad: ins?.unidad_medida || 'g',
        cantidad_bruta_consumida: Number(brutoTotalPropuesto.toFixed(2))
      };
    });

    setIngredientesConsumidos(propuesta);
  }, [recetaId, cantidad, recetas, insumos]);

  const handleIngredienteChange = (index: number, value: string) => {
    const val = Number(value);
    setIngredientesConsumidos(prev => {
      const next = [...prev];
      next[index].cantidad_bruta_consumida = isNaN(val) ? 0 : val;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cantVal = Number(cantidad);
    if (isNaN(cantVal) || cantVal <= 0) {
      setError('Por favor, ingresa una cantidad de unidades válida.');
      return;
    }

    startTransition(async () => {
      try {
        await registrarLoteProduccion(
          new Date().toISOString().split('T')[0],
          recetaId,
          cantVal,
          null as any, // Supabase RPC admits null
          ingredientesConsumidos.map(i => ({
            insumo_id: i.insumo_id,
            cantidad_bruta_consumida: i.cantidad_bruta_consumida
          }))
        );
        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Error al registrar lote.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-100">Registrar Lote</h3>
            <p className="text-xs text-slate-500 mt-0.5">Descuento de ingredientes y alta de producto</p>
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
            <label className="block text-sm font-semibold text-slate-400 mb-2">Seleccionar Receta</label>
            <select
              required
              value={recetaId}
              onChange={(e) => setRecetaId(e.target.value)}
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3.5 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
            >
              <option value="">-- Seleccionar Receta --</option>
              {recetas.map(r => (
                <option key={r.id} value={r.id}>{r.nombre} (Rend. {r.porciones_rendimiento} u.)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Unidades Producidas</label>
            <input
              type="number"
              required
              placeholder="Ej. 120"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
            />
          </div>

          {ingredientesConsumidos.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-primary">
                Insumos Consumidos (Editar si difiere del teórico)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {ingredientesConsumidos.map((ing, idx) => (
                  <div key={ing.insumo_id} className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-sm font-medium text-slate-300 truncate flex-1">{ing.nombre}</span>
                    <div className="flex items-center gap-2 w-32 shrink-0">
                      <input
                        type="number"
                        step="any"
                        value={ing.cantidad_bruta_consumida}
                        onChange={(e) => handleIngredienteChange(idx, e.target.value)}
                        className="block w-full text-right rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-sm text-slate-100 focus:outline-none min-h-[36px]"
                      />
                      <span className="text-xs text-slate-500 w-5 shrink-0">{ing.unidad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-danger-rojo font-semibold">{error}</div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center items-center rounded-xl bg-primary py-4 text-base font-bold text-white shadow-md hover:bg-primary/95 disabled:opacity-50 transition min-h-[48px]"
          >
            {isPending ? 'Confirmando...' : 'Confirmar Lote'}
          </button>
        </form>
      </div>
    </div>
  );
}
