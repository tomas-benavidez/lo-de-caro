'use client';

import React, { useState } from 'react';
import { ChefHat, Calendar, Clipboard, Weight, Plus } from 'lucide-react';
import RegistrarLoteForm from './RegistrarLoteForm';

interface Props {
  inicialLotes: any[];
  recetas: any[];
  insumos: any[];
}

export default function LotesListClient({ inicialLotes, recetas, insumos }: Props) {
  const [lotes, setLotes] = useState<any[]>(inicialLotes);
  const [mostrarForm, setMostrarForm] = useState(false);

  const handleLoteRegistrado = () => {
    // Reload page or re-fetch in a production scenario.
    // For simplicity under dynamic client update:
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Big floating/action button for registering production */}
      <button
        onClick={() => setMostrarForm(true)}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 px-6 rounded-2xl font-bold shadow-md hover:bg-primary/95 transition min-h-[54px] text-base"
      >
        <Plus className="h-5 w-5 text-white" />
        <span>Registrar Cocina de Lote</span>
      </button>

      {/* Title for history */}
      <div className="border-t border-slate-800 pt-4">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Historial de Lotes Producidos</h2>
        
        {/* Batches list */}
        <div className="space-y-4">
          {lotes.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No hay lotes registrados este mes.
            </div>
          ) : (
            lotes.map((lote) => {
              const nombreReceta = lote.recetas?.nombre || 'Receta Desconocida';
              const rendimiento = lote.recetas?.porciones_rendimiento || 1;
              return (
                <div key={lote.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-100 text-base flex items-center gap-1.5">
                        <ChefHat className="h-4.5 w-4.5 text-primary" />
                        {nombreReceta}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Fecha: {lote.fecha}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary block">
                        {lote.cantidad_producida} unidades
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        Lote #{lote.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  {/* Consumed ingredients summary */}
                  {lote.lote_ingredientes && lote.lote_ingredientes.length > 0 && (
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
                      <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                        <Clipboard className="h-3.5 w-3.5 text-slate-500" />
                        Insumos Consumidos
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {lote.lote_ingredientes.map((li: any) => {
                          const nombreInsumo = li.insumos?.nombre || 'Insumo';
                          const unidad = li.insumos?.unidad_medida || '';
                          return (
                            <div key={li.id} className="flex justify-between text-xs text-slate-400 border-b border-slate-900 last:border-b-0 py-1">
                              <span>{nombreInsumo}</span>
                              <span className="font-semibold text-slate-200">
                                {Number(li.cantidad_bruta_consumida).toLocaleString('es-AR')} {unidad}
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
      </div>

      {mostrarForm && (
        <RegistrarLoteForm
          recetas={recetas}
          insumos={insumos}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleLoteRegistrado}
        />
      )}
    </div>
  );
}
