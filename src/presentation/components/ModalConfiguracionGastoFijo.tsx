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
    'w-full bg-white border border-stone-300 rounded-lg p-2.5 text-sm text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ' +
    'focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:cursor-not-allowed ' +
    'transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-gasto-fijo"
    >
      <div className="relative w-full max-w-sm bg-marca-beige rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 id="titulo-modal-gasto-fijo" className="text-base font-bold text-marca-canela">
              Gasto Fijo por Porción
            </h2>
            <p className="text-xs text-stone-500">Costo indirecto estimado por unidad elaborada</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar modal de configuración"
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
              Guardar Configuración
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
