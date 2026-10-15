import React, { useEffect, useRef } from 'react';
import { Boton } from './Boton.tsx';

export interface ModalConfirmacionProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  confirmando?: boolean;
  error?: string | null;
  onConfirmar: () => void | Promise<void>;
  onCancelar: () => void;
}

/**
 * Modal accesible de confirmación destructiva.
 * Implementa role="dialog", foco inicial en Cancelar para prevenir eliminaciones accidentales,
 * cierre con Escape y botón de confirmación con variante 'peligro'.
 */
export const ModalConfirmacion: React.FC<ModalConfirmacionProps> = ({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Eliminar definitivamente',
  textoCancelar = 'Cancelar',
  confirmando = false,
  error = null,
  onConfirmar,
  onCancelar,
}) => {
  const botonCancelarRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en Cancelar y manejo de tecla Escape
  useEffect(() => {
    if (abierto) {
      setTimeout(() => botonCancelarRef.current?.focus(), 50);

      const manejarKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !confirmando) {
          onCancelar();
        }
      };

      window.addEventListener('keydown', manejarKeyDown);
      return () => window.removeEventListener('keydown', manejarKeyDown);
    }
  }, [abierto, confirmando, onCancelar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirmacion-titulo"
      aria-describedby="modal-confirmacion-mensaje"
      onClick={onCancelar}
    >
      <div
        className="relative w-full sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-marca-canela/25 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Franja superior con acento en gradiente de marca */}
        <div className="h-1.5 w-full bg-gradient-to-r from-marca-tomate via-marca-canela to-marca-otono shrink-0" />

        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/80 shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-marca-tomate/10 border border-marca-tomate/20 flex items-center justify-center text-marca-tomate shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 id="modal-confirmacion-titulo" className="font-titular font-bold text-stone-900 text-lg sm:text-xl">
                {titulo}
              </h2>
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
            onClick={onCancelar}
            disabled={confirmando}
            aria-label="Cerrar modal de confirmación"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 active:bg-stone-200 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="text-xl leading-none font-bold" aria-hidden="true">&times;</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-marca-tomate/40 rounded-xl text-xs text-marca-tomate font-medium"
            >
              {error}
            </div>
          )}

          <p id="modal-confirmacion-mensaje" className="text-sm text-stone-700 leading-relaxed">
            {mensaje}
          </p>

          <p className="text-xs text-stone-500">
            Esta acción no se puede deshacer.
          </p>

          {/* Acciones */}
          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2.5">
            <Boton
              ref={botonCancelarRef}
              type="button"
              variante="cancelar"
              tamano="mediano"
              disabled={confirmando}
              onClick={onCancelar}
            >
              {textoCancelar}
            </Boton>

            <Boton
              type="button"
              variante="peligro"
              tamano="mediano"
              disabled={confirmando}
              onClick={onConfirmar}
            >
              {confirmando ? 'Eliminando...' : textoConfirmar}
            </Boton>
          </div>
        </div>
      </div>
    </div>
  );
};
