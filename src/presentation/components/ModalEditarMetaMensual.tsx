import React, { useState, useEffect, useRef } from 'react';
import { Boton } from './Boton.tsx';
import { formatearMesLegible } from '../../domain/services/finanzaServicio.ts';

export interface ModalEditarMetaMensualProps {
  abierto: boolean;
  periodo: string; // 'YYYY-MM' o 'TODOS'
  valorActual: number;
  onCerrar: () => void;
  onGuardar: (nuevoMonto: number, periodo: string, guardarComoDefault?: boolean) => void;
}

/**
 * Modal accesible para editar la meta de retiro mensual de Caro.
 * Implementa trampa de foco accesible (WAI-ARIA), restauración de foco,
 * presets rápidos y validación defensiva.
 */
export const ModalEditarMetaMensual: React.FC<ModalEditarMetaMensualProps> = ({
  abierto,
  periodo,
  valorActual,
  onCerrar,
  onGuardar,
}) => {
  const [montoTexto, setMontoTexto] = useState('');
  const [aplicarComoDefault, setAplicarComoDefault] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ultimoFocoActivoRef = useRef<HTMLElement | null>(null);

  // Inicialización y guardado del elemento con foco previo
  useEffect(() => {
    if (abierto) {
      ultimoFocoActivoRef.current = document.activeElement as HTMLElement | null;
      setMontoTexto(valorActual > 0 ? valorActual.toString() : '300000');
      setAplicarComoDefault(false);
      setErrorValidacion(null);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 60);
      return () => clearTimeout(timer);
    } else {
      // Restauración de foco al cerrar
      if (ultimoFocoActivoRef.current && typeof ultimoFocoActivoRef.current.focus === 'function') {
        ultimoFocoActivoRef.current.focus();
      }
    }
  }, [abierto, valorActual]);

  // Trampa de foco accesible (WAI-ARIA) y tecla Escape
  useEffect(() => {
    if (!abierto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onCerrar();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const elementosInteractivos = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (elementosInteractivos.length === 0) return;

        const primerElemento = elementosInteractivos[0];
        const ultimoElemento = elementosInteractivos[elementosInteractivos.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === primerElemento) {
            e.preventDefault();
            ultimoElemento.focus();
          }
        } else {
          if (document.activeElement === ultimoElemento) {
            e.preventDefault();
            primerElemento.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [abierto, onCerrar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = montoTexto.trim();
    if (!limpio) {
      setErrorValidacion('Por favor ingresá un monto para tu objetivo mensual.');
      inputRef.current?.focus();
      return;
    }
    const parsed = parseFloat(limpio);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorValidacion('Ingresá un monto objetivo válido mayor a $0.');
      inputRef.current?.focus();
      return;
    }
    const montoFinal = Math.round(parsed);
    onGuardar(montoFinal, periodo, aplicarComoDefault);
    onCerrar();
  };

  const seleccionarPreset = (preset: number) => {
    setMontoTexto(preset.toString());
    setErrorValidacion(null);
    inputRef.current?.focus();
  };

  if (!abierto) return null;

  const estiloInput =
    'w-full bg-white border border-stone-300 rounded-lg p-2.5 text-sm text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ' +
    'focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:cursor-not-allowed ' +
    'transition-colors';

  const textoPeriodo =
    periodo === 'TODOS'
      ? 'Meta Mensual de Referencia General'
      : `Meta para ${formatearMesLegible(periodo)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-meta-mensual"
      ref={modalRef}
    >
      <div className="relative w-full max-w-sm bg-marca-beige rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 id="titulo-modal-meta-mensual" className="text-base font-bold text-marca-canela">
              Objetivo de Retiro Mensual
            </h2>
            <p className="text-xs text-stone-500">{textoPeriodo}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar modal de meta mensual"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-700 active:text-stone-900 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorValidacion && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-marca-tomate/40 rounded-xl text-xs text-marca-tomate font-medium"
            >
              {errorValidacion}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="input-meta-mensual"
              className="block text-xs font-bold text-stone-700"
            >
              Monto objetivo mensual en pesos ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                $
              </span>
              <input
                id="input-meta-mensual"
                ref={inputRef}
                type="number"
                step="1000"
                min="0"
                value={montoTexto}
                onChange={(e) => {
                  setMontoTexto(e.target.value);
                  if (errorValidacion) setErrorValidacion(null);
                }}
                placeholder="Ej. 300000"
                className={`${estiloInput} pl-7 font-bold text-base`}
              />
            </div>

            {/* Presets rápidos */}
            <div className="pt-1">
              <span className="text-[10px] font-semibold text-stone-500 block mb-1">
                Atajos rápidos:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[300000, 350000, 400000, 500000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => seleccionarPreset(preset)}
                    className="text-[11px] font-semibold px-2 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 hover:border-stone-300 active:bg-stone-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ${preset.toLocaleString('es-AR')}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed pt-1">
              Ajustá tu meta para reflejar tus expectativas o la temporada. El porcentaje de avance
              se recalculará automáticamente frente a tu ganancia neta.
            </p>
          </div>

          {/* Opción para guardar también como default general */}
          {periodo !== 'TODOS' && (
            <div className="pt-2 border-t border-stone-200/80">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={aplicarComoDefault}
                  onChange={(e) => setAplicarComoDefault(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 text-marca-canela focus-visible:ring-2 focus-visible:ring-marca-canela disabled:cursor-not-allowed"
                />
                <span className="text-xs text-stone-700 group-hover:text-stone-900 leading-tight">
                  Guardar también como objetivo mensual base para futuros meses
                </span>
              </label>
            </div>
          )}

          <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2">
            <Boton
              type="button"
              variante="secundario"
              tamano="mediano"
              onClick={onCerrar}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              variante="primario"
              tamano="mediano"
            >
              Guardar Objetivo
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
