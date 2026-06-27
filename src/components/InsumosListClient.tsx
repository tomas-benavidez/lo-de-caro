'use client';

import React, { useState } from 'react';
import { Search, PlusCircle, AlertTriangle, Scale } from 'lucide-react';
import { Insumo } from '@/domain/insumo';
import ComprarInsumoModal from './ComprarInsumoModal';

export default function InsumosListClient({ inicialInsumos }: { inicialInsumos: Insumo[] }) {
  const [insumos, setInsumos] = useState<Insumo[]>(inicialInsumos);
  const [busqueda, setBusqueda] = useState('');
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null);

  const filtrados = insumos.filter(ins =>
    ins.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleCompraCompletada = (insumoActualizado: any) => {
    setInsumos(prev =>
      prev.map(ins => ins.id === insumoActualizado.id ? {
        ...ins,
        stock_actual: Number(insumoActualizado.stock_actual),
        costo_bruto_unitario: Number(insumoActualizado.costo_bruto_unitario)
      } : ins)
    );
    setInsumoSeleccionado(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar ingrediente o envase..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="block w-full rounded-xl bg-slate-900 border border-slate-800 pl-12 pr-4 py-3.5 text-base text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none min-h-[48px]"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            No se encontraron insumos.
          </div>
        ) : (
          filtrados.map((ins) => {
            const esBajoStock = ins.stock_minimo !== undefined && ins.stock_actual <= ins.stock_minimo;
            return (
              <div
                key={ins.id}
                className={`bg-slate-900 border ${
                  esBajoStock ? 'border-danger-rojo/30' : 'border-slate-800'
                } p-4 rounded-2xl flex flex-col justify-between gap-3 transition-colors`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{ins.nombre}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Scale className="h-3.5 w-3.5" />
                        Unidad: {ins.unidad_medida}
                      </span>
                      <span>•</span>
                      <span>Costo unitario: ${ins.costo_bruto_unitario.toFixed(4)}</span>
                    </div>
                  </div>
                  
                  {esBajoStock && (
                    <span className="flex items-center gap-1 bg-danger-rojo/10 border border-danger-rojo/20 text-danger-rojo text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                      <AlertTriangle className="h-3.5 w-3.5" /> Alerta Stock
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm">
                    <span className="text-slate-500">En stock:</span>{' '}
                    <span className={`font-black text-base ${esBajoStock ? 'text-danger-rojo' : 'text-slate-100'}`}>
                      {ins.stock_actual} {ins.unidad_medida}
                    </span>
                  </div>

                  <button
                    onClick={() => setInsumoSeleccionado(ins)}
                    className="flex items-center gap-1.5 bg-slate-800 text-primary hover:bg-slate-700 font-bold px-3 py-2 rounded-xl text-sm border border-slate-800 min-h-[44px]"
                  >
                    <PlusCircle className="h-4 w-4" /> Comprar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {insumoSeleccionado && (
        <ComprarInsumoModal
          insumo={insumoSeleccionado}
          onClose={() => setInsumoSeleccionado(null)}
          onSuccess={handleCompraCompletada}
        />
      )}
    </div>
  );
}
