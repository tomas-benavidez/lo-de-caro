import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Producto,
  MotivoAjusteStock,
  AjusteStockProductoInput,
} from '../../domain/models/producto.ts';
import { calcularVariacionAjusteStock } from '../../domain/services/produccionServicio.ts';
import { Boton } from './Boton.tsx';

export interface ModalAjusteStockProductoProps {
  abierto: boolean;
  producto: Producto | null;
  onCerrar: () => void;
  onGuardar: (input: AjusteStockProductoInput) => Promise<void>;
}

const MOTIVOS_AJUSTE: { id: MotivoAjusteStock; label: string; descripcion: string }[] = [
  {
    id: 'Consumo personal',
    label: 'Consumo personal / familiar',
    descripcion: 'Almuerzo o cena propia retirada del freezer',
  },
  {
    id: 'Regalo / Degustación',
    label: 'Regalo / Degustación',
    descripcion: 'Obsequios a clientes, amigos o muestras comerciales',
  },
  {
    id: 'Merma / Rotura',
    label: 'Merma / Rotura / Descarte',
    descripcion: 'Paquetes dañados, roturas o descarte en freezer',
  },
  {
    id: 'Ajuste de inventario',
    label: 'Ajuste de inventario (Conteo físico)',
    descripcion: 'Corrección manual tras recuento físico de bandejas',
  },
];

/**
 * Modal accesible para ajustar manualmente el stock físico de productos congelados en freezer.
 * No altera materias primas de la alacena.
 * Cumple estrictamente con los 5 estados obligatorios en cada control de UI.
 */
export const ModalAjusteStockProducto: React.FC<ModalAjusteStockProductoProps> = ({
  abierto,
  producto,
  onCerrar,
  onGuardar,
}) => {
  const [nuevoStock, setNuevoStock] = useState<string>('0');
  const [motivo, setMotivo] = useState<MotivoAjusteStock>('Consumo personal');
  const [observaciones, setObservaciones] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const inputStockRef = useRef<HTMLInputElement>(null);
  const elementoPrevioRef = useRef<HTMLElement | null>(null);

  // Inicialización de valores al abrir el modal y restauración de foco
  useEffect(() => {
    if (abierto && producto) {
      elementoPrevioRef.current = document.activeElement as HTMLElement | null;
      setNuevoStock(producto.stockActual.toString());
      setMotivo('Consumo personal');
      setObservaciones('');
      setErrorValidacion(null);
      setGuardando(false);

      setTimeout(() => {
        if (inputStockRef.current) {
          inputStockRef.current.focus();
          inputStockRef.current.select();
        }
      }, 50);
    } else if (!abierto && elementoPrevioRef.current) {
      elementoPrevioRef.current.focus();
      elementoPrevioRef.current = null;
    }
  }, [abierto, producto]);

  // Cierre accesible con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto && !guardando) {
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, guardando, onCerrar]);

  // Cálculo numérico y diferencia visual en tiempo real
  const nuevoStockNum = useMemo(() => {
    const parseado = parseFloat(nuevoStock);
    return isNaN(parseado) ? null : parseado;
  }, [nuevoStock]);

  const esValido = nuevoStockNum !== null && nuevoStockNum >= 0 && Number.isFinite(nuevoStockNum);

  const diferencia = useMemo(() => {
    if (!producto || nuevoStockNum === null) return 0;
    return calcularVariacionAjusteStock(producto.stockActual, nuevoStockNum);
  }, [producto, nuevoStockNum]);

  // Modificación rápida táctil
  const aplicarAjusteRelativo = (delta: number) => {
    if (!producto) return;
    const base = nuevoStockNum !== null && nuevoStockNum >= 0 ? nuevoStockNum : producto.stockActual;
    const siguiente = Math.max(0, Math.round((base + delta) * 1000) / 1000);
    setNuevoStock(siguiente.toString());
    setErrorValidacion(null);
  };

  if (!abierto || !producto) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setErrorValidacion(null);

    if (nuevoStockNum === null || nuevoStockNum < 0 || !Number.isFinite(nuevoStockNum)) {
      setErrorValidacion('El stock físico no puede ser negativo.');
      inputStockRef.current?.focus();
      return;
    }

    setGuardando(true);
    try {
      await onGuardar({
        nuevoStock: nuevoStockNum,
        motivo,
        observaciones: observaciones.trim() || undefined,
      });
      onCerrar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar el ajuste de stock.';
      setErrorValidacion(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-ajuste-stock"
      aria-describedby="descripcion-modal-ajuste-stock"
      onClick={() => {
        if (!guardando) onCerrar();
      }}
    >
      <div
        className="relative w-full sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-marca-canela/25 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Franja superior con acento en gradiente de marca */}
        <div className="h-1.5 w-full bg-gradient-to-r from-marca-tomate via-marca-canela to-marca-otono shrink-0" />

        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/80 shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-marca-canela/10 border border-marca-canela/20 flex items-center justify-center text-marca-canela shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2
                id="titulo-modal-ajuste-stock"
                className="font-titular font-bold text-stone-900 text-lg sm:text-xl leading-tight"
              >
                Ajustar Stock de Freezer
              </h2>
              <p id="descripcion-modal-ajuste-stock" className="text-xs text-stone-500">
                {producto.nombre} ({producto.categoria})
              </p>
            </div>
          </div>

          {/* Detalle decorativo sutil de marca */}
          <img
            src="/personajes/Recurso 7.svg"
            alt=""
            aria-hidden="true"
            className="absolute right-14 top-3 w-8 h-8 opacity-15 pointer-events-none select-none hidden sm:block"
          />

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar modal de ajuste de stock"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 active:bg-stone-200 active:scale-95 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="text-xl leading-none font-bold" aria-hidden="true">&times;</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {errorValidacion && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-marca-tomate/40 rounded-xl text-xs text-stone-900 font-medium space-y-1"
            >
              <p className="font-bold text-marca-tomate">Atención:</p>
              <p>{errorValidacion}</p>
            </div>
          )}

          {/* Banner de Aislamiento de Materias Primas */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-stone-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <span aria-hidden="true">💡</span>
              <span>Aviso de Inventario</span>
            </div>
            <p className="text-stone-700 leading-relaxed text-[11px]">
              Este ajuste actualiza <strong>únicamente el stock de congelados en freezer</strong>.{' '}
              <strong>NO descuenta ni repone materias primas</strong> en la alacena porque este
              plato ya fue cocinado previamente.
            </p>
          </div>

          {/* Tarjeta de Stock Actual vs Nuevo */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600 font-medium">Stock actual en freezer:</span>
              <span className="font-bold text-stone-900">
                {producto.stockActual} {producto.unidadVenta}
              </span>
            </div>

            {/* Input de nuevo stock */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-nuevo-stock-fisico"
                className="block text-xs font-bold text-stone-800"
              >
                Nuevo stock físico contado: <span className="text-marca-tomate">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={inputStockRef}
                  id="input-nuevo-stock-fisico"
                  name="nuevoStockFisico"
                  type="number"
                  min="0"
                  step="any"
                  value={nuevoStock}
                  onChange={(e) => {
                    setNuevoStock(e.target.value);
                    setErrorValidacion(null);
                  }}
                  disabled={guardando}
                  required
                  placeholder="0"
                  className="flex-1 px-3 py-2 text-base font-bold bg-white text-stone-900 border border-stone-300 rounded-lg shadow-xs transition-colors hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed text-center"
                />
                <span className="text-xs font-semibold text-stone-500 shrink-0">
                  {producto.unidadVenta}
                </span>
              </div>
              {nuevoStockNum !== null && nuevoStockNum < 0 && (
                <p className="text-[11px] font-semibold text-marca-tomate">
                  El stock físico no puede ser menor a 0.
                </p>
              )}
              {nuevoStock.trim() === '' && (
                <p className="text-[11px] font-medium text-stone-500">
                  Ingresá la cantidad física de unidades en freezer.
                </p>
              )}
            </div>

            {/* Botones de ajuste rápido (-5, -1, +1, +5) */}
            <div className="space-y-1">
              <span className="text-[10px] text-stone-500 font-medium">Ajuste rápido táctil:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { valor: -5, etiqueta: '-5' },
                  { valor: -1, etiqueta: '-1' },
                  { valor: +1, etiqueta: '+1' },
                  { valor: +5, etiqueta: '+5' },
                ].map((btn) => (
                  <button
                    key={btn.etiqueta}
                    type="button"
                    onClick={() => aplicarAjusteRelativo(btn.valor)}
                    disabled={guardando || (btn.valor < 0 && (nuevoStockNum ?? 0) <= 0)}
                    className="min-h-[44px] py-1.5 px-2 text-xs font-bold rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:border-stone-300 active:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label={`Ajustar ${btn.etiqueta} ${producto.unidadVenta}`}
                  >
                    {btn.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge de Diferencia */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Variación de inventario:</span>
              {nuevoStockNum === null ? (
                <span className="text-marca-tomate font-semibold bg-red-50 border border-marca-tomate/30 px-2 py-0.5 rounded text-[11px]">
                  Número inválido
                </span>
              ) : nuevoStockNum < 0 ? (
                <span className="text-marca-tomate font-bold bg-red-50 border border-marca-tomate/40 px-2 py-0.5 rounded text-[11px]">
                  Inválido (no puede ser negativo)
                </span>
              ) : diferencia === 0 ? (
                <span className="font-semibold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded text-[11px]">
                  Sin cambios (0 {producto.unidadVenta})
                </span>
              ) : diferencia > 0 ? (
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                  +{diferencia} {producto.unidadVenta} (Aumento)
                </span>
              ) : (
                <span className="font-bold text-white bg-marca-tomate px-2 py-0.5 rounded text-[11px]">
                  {diferencia} {producto.unidadVenta} (Retiro / Salida)
                </span>
              )}
            </div>
          </div>

          {/* Selector de Motivo Obligatorio */}
          <div className="space-y-1.5">
            <label htmlFor="selector-motivo-ajuste" className="block text-xs font-bold text-stone-800">
              Motivo del ajuste: <span className="text-marca-tomate">*</span>
            </label>
            <select
              id="selector-motivo-ajuste"
              name="motivoAjuste"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoAjusteStock)}
              disabled={guardando}
              className="w-full px-3 py-2 text-xs bg-white text-stone-900 border border-stone-300 rounded-lg shadow-xs transition-colors hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
            >
              {MOTIVOS_AJUSTE.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Opcional de Observaciones */}
          <div className="space-y-1.5">
            <label
              htmlFor="textarea-observaciones-ajuste"
              className="block text-xs font-medium text-stone-700"
            >
              Observaciones adicionales (opcional):
            </label>
            <textarea
              id="textarea-observaciones-ajuste"
              name="observacionesAjuste"
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={guardando}
              placeholder="ej. Degustación para evento, almuerzo familiar del domingo..."
              className="w-full px-3 py-2 text-xs bg-white text-stone-900 border border-stone-300 rounded-lg shadow-xs transition-colors placeholder:text-stone-400 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2.5 shrink-0">
            <Boton
              type="button"
              variante="cancelar"
              tamano="mediano"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              variante="tomate"
              tamano="mediano"
              disabled={guardando || !esValido}
            >
              {guardando ? 'Guardando...' : 'Confirmar Ajuste'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
