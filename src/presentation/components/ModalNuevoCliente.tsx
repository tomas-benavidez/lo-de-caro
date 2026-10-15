import React, { useState, useEffect, useRef } from 'react';
import { Cliente, NuevoClienteInput } from '../../domain/models/cliente.ts';
import { Boton } from './Boton.tsx';

export interface ModalNuevoClienteProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (input: NuevoClienteInput) => Promise<Cliente>;
}

export const ModalNuevoCliente: React.FC<ModalNuevoClienteProps> = ({
  abierto,
  onCerrar,
  onGuardar,
}) => {
  const [nombreApellido, setNombreApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const inputNombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) {
      setNombreApellido('');
      setTelefono('');
      setErrorValidacion(null);
      setTimeout(() => {
        inputNombreRef.current?.focus();
      }, 50);
    }
  }, [abierto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto && !guardando) {
        e.stopImmediatePropagation();
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [abierto, guardando, onCerrar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = nombreApellido.trim();
    if (!limpio) {
      setErrorValidacion('El nombre y apellido del cliente es obligatorio.');
      return;
    }

    setGuardando(true);
    setErrorValidacion(null);
    try {
      await onGuardar({
        nombreApellido: limpio,
        telefono: telefono.trim() || undefined,
      });
      onCerrar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar cliente.';
      setErrorValidacion(mensaje);
    } finally {
      setGuardando(false);
    }
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
      aria-labelledby="titulo-modal-nuevo-cliente"
      onClick={(e) => {
        if (e.target === e.currentTarget && !guardando) onCerrar();
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 id="titulo-modal-nuevo-cliente" className="font-titular font-bold text-stone-900 text-lg sm:text-xl">
                Nuevo Cliente
              </h2>
              <p className="text-xs text-stone-500">Agregá un cliente habitual a la agenda</p>
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
            aria-label="Cerrar modal"
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

          <div>
            <label htmlFor="input-nombre-cliente" className="block text-xs font-bold text-stone-700 mb-1">
              Nombre y Apellido *
            </label>
            <input
              id="input-nombre-cliente"
              ref={inputNombreRef}
              type="text"
              value={nombreApellido}
              onChange={(e) => setNombreApellido(e.target.value)}
              placeholder="Ej. Verónica Molina"
              maxLength={150}
              disabled={guardando}
              className={estiloInput}
              required
            />
          </div>

          <div>
            <label htmlFor="input-telefono-cliente" className="block text-xs font-bold text-stone-700 mb-1">
              Teléfono de Contacto (Opcional)
            </label>
            <input
              id="input-telefono-cliente"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 11 4455-6677"
              maxLength={50}
              disabled={guardando}
              className={estiloInput}
            />
            <p className="text-[11px] text-stone-500 mt-1">Permite enviar mensajes de WhatsApp directamente.</p>
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2.5">
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
              disabled={guardando || !nombreApellido.trim()}
            >
              {guardando ? 'Guardando...' : 'Crear Cliente'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
