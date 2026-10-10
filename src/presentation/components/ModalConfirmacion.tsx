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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirmacion-titulo"
      aria-describedby="modal-confirmacion-mensaje"
      onClick={onCancelar}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <h2 id="modal-confirmacion-titulo" className="text-base font-bold text-stone-900">
            {titulo}
          </h2>

          <button
            type="button"
            onClick={onCancelar}
            disabled={confirmando}
            aria-label="Cerrar modal de confirmación"
            className="text-stone-400 hover:text-stone-700 active:text-stone-900 p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-marca-tomate/40 rounded-lg text-xs text-marca-tomate font-medium"
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
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <Boton
              ref={botonCancelarRef}
              type="button"
              variante="secundario"
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
