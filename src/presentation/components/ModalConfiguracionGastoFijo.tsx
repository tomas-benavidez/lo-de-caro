import React, { useState, useEffect, useRef } from 'react';
import { Boton } from './Boton.tsx';

export interface ModalConfiguracionGastoFijoProps {
  abierto: boolean;
  valorActual: number;
  onCerrar: () => void;
  onGuardar: (nuevoMonto: number) => void;
}

export const ModalConfiguracionGastoFijo: React.FC<ModalConfiguracionGastoFijoProps> = ({
  abierto,
  valorActual,
  onCerrar,
  onGuardar,
}) => {
  const [montoTexto, setMontoTexto] = useState('');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) {
      setMontoTexto(valorActual > 0 ? valorActual.toString() : '');
      setErrorValidacion(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [abierto, valorActual]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) {
        e.stopImmediatePropagation();
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [abierto, onCerrar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(montoTexto);
    if (montoTexto.trim() !== '' && (isNaN(parsed) || parsed < 0)) {
      setErrorValidacion('Ingresá un monto válido mayor o igual a $0.');
      return;
    }
    const montoFinal = isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed * 100) / 100;
    onGuardar(montoFinal);
    onCerrar();
  };

  if (!abierto) return null;

  const estiloInput =
    'w-full bg-white border border-stone-300 rounded-xl p-2.5 text-sm text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-marca-canela active:border-marca-canela ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela ' +
    'disabled:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed ' +
    'transition-all duration-150';

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-gasto-fijo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        className="relative w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-marca-canela/25 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Franja superior con acento en gradiente de marca */}
        <div className="h-1.5 w-full bg-gradient-to-r from-marca-tomate via-marca-canela to-marca-otono shrink-0" />

        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/80 shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-marca-canela/10 border border-marca-canela/20 flex items-center justify-center text-marca-canela shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 id="titulo-modal-gasto-fijo" className="font-titular font-bold text-stone-900 text-lg sm:text-xl">
                Gasto Fijo por Porción
              </h2>
              <p className="text-xs text-stone-500">Costo indirecto estimado por unidad elaborada</p>
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
            aria-label="Cerrar modal de configuración"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 active:bg-stone-200 active:scale-95 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="text-xl leading-none font-bold" aria-hidden="true">&times;</span>
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
            <label htmlFor="input-gasto-fijo-porcion" className="block text-xs font-bold text-stone-700">
              Monto fijo en pesos ($ / porción)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                $
              </span>
              <input
                id="input-gasto-fijo-porcion"
                ref={inputRef}
                type="number"
                step="any"
                min="0"
                value={montoTexto}
                onChange={(e) => setMontoTexto(e.target.value)}
                placeholder="Ej. 500"
                className={`${estiloInput} pl-7 font-bold text-base`}
              />
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Este valor se suma directamente al costo de elaboración de cada porción en todas las recetas,
              afectando el cálculo del porcentaje de ganancia real (contempla gas, electricidad, desgaste o empaque básico).
            </p>
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2.5">
            <Boton
              type="button"
              variante="cancelar"
              tamano="mediano"
              onClick={onCerrar}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              variante="tomate"
              tamano="mediano"
            >
              Guardar Configuración
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
