'use client';

import React, { useState, useTransition } from 'react';
import { Plus, ShoppingBag, Info } from 'lucide-react';
import { createProducto } from '@/infrastructure/actions/productos';
import { Insumo } from '@/domain/insumo';
import { calcularCostoFabricacionProducto, calcularMargenGanancia } from '@/domain/producto';
import { calcularCostoTotalReceta, Receta, IngredienteReceta } from '@/domain/receta';

interface Props {
  insumos: Insumo[];
  recetas: any[];
  productos: any[];
  onAddProducto: (newProducto: any) => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

export default function ProductosConfig({
  insumos,
  recetas,
  productos,
  onAddProducto,
  onError,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // Form states
  const [nombre, setNombre] = useState('');
  const [recetaId, setRecetaId] = useState('');
  const [unidadVenta, setUnidadVenta] = useState('');
  const [cantidadUnidadesBase, setCantidadUnidadesBase] = useState('');
  const [precioLista, setPrecioLista] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    onSuccess(null);

    const unidadesBaseNum = Number(cantidadUnidadesBase);
    const precioListaNum = Number(precioLista);

    if (!nombre.trim() || !recetaId || !unidadVenta.trim() || isNaN(unidadesBaseNum) || unidadesBaseNum <= 0 || isNaN(precioListaNum) || precioListaNum <= 0) {
      onError('Por favor completa todos los campos con valores válidos.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createProducto({
          nombre: nombre.trim(),
          receta_id: recetaId,
          unidad_venta: unidadVenta.trim(),
          cantidad_unidades_base: unidadesBaseNum,
          precio_lista: precioListaNum
        });
        
        // Find matching recipe to attach back to local state
        const matchingRecipe = recetas.find(r => r.id === recetaId);
        const fullNewProduct = {
          ...res,
          recetas: matchingRecipe
        };

        onAddProducto(fullNewProduct);

        // Reset
        setNombre('');
        setRecetaId('');
        setUnidadVenta('');
        setCantidadUnidadesBase('');
        setPrecioLista('');
        onSuccess('Producto de venta creado con éxito.');
      } catch (err: any) {
        onError(err.message || 'Error al crear el producto.');
      }
    });
  };

  // Metrics helper using domain calculations
  const getProductoMetrics = (p: any) => {
    const matchedRecipe = recetas.find(r => r.id === p.receta_id);
    if (!matchedRecipe) {
      return { costoFabricacion: 0, margenGanancia: 0 };
    }

    const ingData = (matchedRecipe.receta_ingredientes || []).map((ri: any) => {
      const matchedInsumo = insumos.find(i => i.id === ri.insumo_id);
      const costoBrutoUnitario = matchedInsumo ? Number(matchedInsumo.costo_bruto_unitario) : 0;
      return {
        ingrediente: {
          id: ri.id,
          receta_id: matchedRecipe.id,
          insumo_id: ri.insumo_id,
          peso_limpio: Number(ri.peso_limpio),
          porcentaje_merma: Number(ri.porcentaje_merma),
        } as IngredienteReceta,
        costoBrutoUnitario
      };
    });

    const tempReceta: Receta = {
      id: matchedRecipe.id,
      nombre: matchedRecipe.nombre,
      porciones_rendimiento: Number(matchedRecipe.porciones_rendimiento),
      costo_envase: Number(matchedRecipe.costo_envase),
      created_at: new Date(matchedRecipe.created_at)
    };

    const costoTotalReceta = calcularCostoTotalReceta(tempReceta, ingData);
    
    try {
      const costoFabricacion = calcularCostoFabricacionProducto(
        costoTotalReceta,
        Number(matchedRecipe.porciones_rendimiento),
        Number(p.cantidad_unidades_base),
        Number(matchedRecipe.costo_envase)
      );

      const margenGanancia = calcularMargenGanancia(Number(p.precio_lista), costoFabricacion);
      return { costoFabricacion, margenGanancia };
    } catch {
      return { costoFabricacion: 0, margenGanancia: 0 };
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-slate-100 text-base">Crear Producto Comercial</h3>

        {recetas.length === 0 ? (
          <div className="rounded-xl bg-accent/10 p-4 text-sm border border-accent/20 text-accent font-medium">
            Atención: Para crear un producto primero debes crear una receta en la pestaña "Recetas".
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nombre Comercial *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Sorrentinos Jamón y Queso (Pack)"
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Receta Vinculada *
              </label>
              <select
                required
                value={recetaId}
                onChange={(e) => setRecetaId(e.target.value)}
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
              >
                <option value="">-- Seleccionar Receta --</option>
                {recetas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} (rinde {r.porciones_rendimiento})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Unidad de Venta *
                </label>
                <input
                  type="text"
                  required
                  value={unidadVenta}
                  onChange={(e) => setUnidadVenta(e.target.value)}
                  placeholder="Ej. docena, caja, pack"
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Porciones por Unidad *
                </label>
                <input
                  type="number"
                  required
                  value={cantidadUnidadesBase}
                  onChange={(e) => setCantidadUnidadesBase(e.target.value)}
                  placeholder="Ej. 12 (para 1 docena)"
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Precio de Venta (Lista) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={precioLista}
                onChange={(e) => setPrecioLista(e.target.value)}
                placeholder="Ej. 4200"
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-white py-3.5 px-4 rounded-xl font-bold hover:bg-primary/95 transition min-h-[48px] cursor-pointer"
            >
              <Plus className="h-5 w-5 text-white" />
              <span>{isPending ? 'Creando Producto...' : 'Crear Producto'}</span>
            </button>
          </form>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag className="h-4.5 w-4.5 text-slate-400" />
          <span>Productos Registrados ({productos.length})</span>
        </h4>

        {productos.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            No hay productos registrados en el sistema.
          </div>
        ) : (
          <div className="space-y-3">
            {productos.map((p) => {
              const { costoFabricacion, margenGanancia } = getProductoMetrics(p);
              const marginPercent = (margenGanancia * 100).toFixed(1);
              const esMargenBajo = margenGanancia < 0.3; // Alert under 30% margin
              
              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-slate-200 text-sm">{p.nombre}</h5>
                      <span className="text-[10px] text-slate-500">
                        Unidad: {p.cantidad_unidades_base}u por {p.unidad_venta}
                      </span>
                    </div>
                    <span className="font-black text-slate-100 text-base">
                      ${Number(p.precio_lista).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/40 text-center text-xs">
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Costo Fab.</span>
                      <span className="font-bold text-danger-rojo mt-0.5 block">
                        ${costoFabricacion.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Margen %</span>
                      <span className={`font-bold mt-0.5 block ${esMargenBajo ? 'text-accent' : 'text-success-verde'}`}>
                        {marginPercent}%
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
