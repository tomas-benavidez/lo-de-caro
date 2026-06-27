'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Trash2, BookOpen, Scale } from 'lucide-react';
import { createReceta } from '@/infrastructure/actions/recetas';
import { Insumo } from '@/domain/insumo';
import { calcularCostoTotalReceta, Receta, IngredienteReceta } from '@/domain/receta';

interface Props {
  insumos: Insumo[];
  recetas: any[];
  onAddReceta: (newReceta: any) => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

export default function RecetasConfig({
  insumos,
  recetas,
  onAddReceta,
  onError,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  
  // Recipe Form States
  const [nombre, setNombre] = useState('');
  const [porcionesRendimiento, setPorcionesRendimiento] = useState('');
  const [costoEnvase, setCostoEnvase] = useState('');
  const [ingredientes, setIngredientes] = useState<{ insumo_id: string; peso_limpio: string; porcentaje_merma: string }[]>([
    { insumo_id: '', peso_limpio: '', porcentaje_merma: '0' }
  ]);

  const handleAddRow = () => {
    setIngredientes(prev => [...prev, { insumo_id: '', peso_limpio: '', porcentaje_merma: '0' }]);
  };

  const handleRemoveRow = (index: number) => {
    setIngredientes(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangeRow = (index: number, field: string, value: string) => {
    setIngredientes(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    onSuccess(null);

    const rendNum = Number(porcionesRendimiento);
    const envaseNum = Number(costoEnvase);

    if (!nombre.trim() || isNaN(rendNum) || rendNum <= 0 || isNaN(envaseNum) || envaseNum < 0) {
      onError('Por favor ingresa un rendimiento y costo de envase válidos.');
      return;
    }

    if (ingredientes.length === 0) {
      onError('La receta debe tener al menos un ingrediente.');
      return;
    }

    // Validate rows
    const formattedIngredientes: { insumo_id: string; peso_limpio: number; porcentaje_merma: number }[] = [];
    for (let i = 0; i < ingredientes.length; i++) {
      const ing = ingredientes[i];
      if (!ing.insumo_id) {
        onError(`Selecciona un insumo para el ingrediente en la fila ${i + 1}.`);
        return;
      }

      const pLimpio = Number(ing.peso_limpio);
      const pMerma = Number(ing.porcentaje_merma);

      if (isNaN(pLimpio) || pLimpio <= 0) {
        onError(`El peso limpio en la fila ${i + 1} debe ser un número positivo.`);
        return;
      }

      if (isNaN(pMerma) || pMerma < 0 || pMerma >= 100) {
        onError(`El porcentaje de merma en la fila ${i + 1} debe ser un número entre 0 y 99.`);
        return;
      }

      formattedIngredientes.push({
        insumo_id: ing.insumo_id,
        peso_limpio: pLimpio,
        porcentaje_merma: pMerma,
      });
    }

    startTransition(async () => {
      try {
        const res = await createReceta(
          nombre.trim(),
          rendNum,
          envaseNum,
          formattedIngredientes
        );

        // Append the ingredients back so local render works
        const fullNewRecipe = {
          ...res,
          receta_ingredientes: formattedIngredientes.map((fi, index) => ({
            id: `temp-${index}-${Date.now()}`,
            receta_id: res.id,
            ...fi
          }))
        };

        onAddReceta(fullNewRecipe);
        
        // Reset form
        setNombre('');
        setPorcionesRendimiento('');
        setCostoEnvase('');
        setIngredientes([{ insumo_id: '', peso_limpio: '', porcentaje_merma: '0' }]);
        onSuccess('Receta creada con éxito.');
      } catch (err: any) {
        onError(err.message || 'Error al crear la receta.');
      }
    });
  };

  // Helper function to calculate total recipe cost using domain functions
  const getCostoReceta = (r: any) => {
    const ingData = (r.receta_ingredientes || []).map((ri: any) => {
      const matchedInsumo = insumos.find(i => i.id === ri.insumo_id);
      const costoBrutoUnitario = matchedInsumo ? Number(matchedInsumo.costo_bruto_unitario) : 0;
      return {
        ingrediente: {
          id: ri.id,
          receta_id: r.id,
          insumo_id: ri.insumo_id,
          peso_limpio: Number(ri.peso_limpio),
          porcentaje_merma: Number(ri.porcentaje_merma),
        } as IngredienteReceta,
        costoBrutoUnitario
      };
    });

    const tempReceta: Receta = {
      id: r.id,
      nombre: r.nombre,
      porciones_rendimiento: Number(r.porciones_rendimiento),
      costo_envase: Number(r.costo_envase),
      created_at: new Date(r.created_at)
    };

    return calcularCostoTotalReceta(tempReceta, ingData);
  };

  return (
    <div className="space-y-6">
      {/* Create Receta Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-slate-100 text-base">Crear Nueva Receta</h3>

        {insumos.length === 0 ? (
          <div className="rounded-xl bg-accent/10 p-4 text-sm border border-accent/20 text-accent font-medium">
            Atención: Para crear una receta primero debes cargar insumos en la sección "Insumos".
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nombre de la Receta *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Receta Pasta Sorrentinos Jamón y Queso"
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Porciones Rendimiento *
                </label>
                <input
                  type="number"
                  required
                  value={porcionesRendimiento}
                  onChange={(e) => setPorcionesRendimiento(e.target.value)}
                  placeholder="Ej. 20"
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Costo de Envase ($) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={costoEnvase}
                  onChange={(e) => setCostoEnvase(e.target.value)}
                  placeholder="Ej. 150"
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                />
              </div>
            </div>

            {/* Dynamic Ingredient Rows */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingredientes / Insumos</span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-xs font-bold text-primary flex items-center gap-1 cursor-pointer min-h-[40px] px-2 rounded-lg hover:bg-slate-800 transition"
                >
                  <Plus className="h-4 w-4" /> Agregar Fila
                </button>
              </div>

              <div className="space-y-3">
                {ingredientes.map((ing, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Ingrediente #{idx + 1}</span>
                      {ingredientes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="text-danger-rojo p-1 hover:bg-danger-rojo/10 rounded-lg transition cursor-pointer min-h-[36px]"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <select
                          value={ing.insumo_id}
                          required
                          onChange={(e) => handleChangeRow(idx, 'insumo_id', e.target.value)}
                          className="block w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none min-h-[44px]"
                        >
                          <option value="">-- Seleccionar Insumo --</option>
                          {insumos.map((ins) => (
                            <option key={ins.id} value={ins.id}>
                              {ins.nombre} ({ins.unidad_medida})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Peso Limpio"
                            value={ing.peso_limpio}
                            onChange={(e) => handleChangeRow(idx, 'peso_limpio', e.target.value)}
                            className="block w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-primary focus:outline-none min-h-[40px]"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="% Merma"
                            value={ing.porcentaje_merma}
                            onChange={(e) => handleChangeRow(idx, 'porcentaje_merma', e.target.value)}
                            className="block w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-primary focus:outline-none min-h-[40px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-white py-3.5 px-4 rounded-xl font-bold hover:bg-primary/95 transition min-h-[48px] cursor-pointer"
            >
              <Plus className="h-5 w-5 text-white" />
              <span>{isPending ? 'Creando Receta...' : 'Crear Receta'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Recetas list */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="h-4.5 w-4.5 text-slate-400" />
          <span>Recetas Registradas ({recetas.length})</span>
        </h4>

        {recetas.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            No hay recetas registradas en el sistema.
          </div>
        ) : (
          <div className="space-y-3">
            {recetas.map((r) => {
              const costoTotal = getCostoReceta(r);
              const rendimiento = Number(r.porciones_rendimiento);
              const costoPorPorcion = rendimiento > 0 ? (costoTotal / rendimiento) : 0;
              return (
                <div key={r.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-slate-200 text-sm">{r.nombre}</h5>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Scale className="h-3.5 w-3.5" />
                        <span>Rendimiento: {r.porciones_rendimiento} porciones</span>
                        <span>•</span>
                        <span>Envase: ${Number(r.costo_envase).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/40 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Costo Total</span>
                      <span className="text-sm font-black text-danger-rojo">
                        ${costoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Costo por Porción</span>
                      <span className="text-sm font-black text-danger-rojo">
                        ${costoPorPorcion.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
