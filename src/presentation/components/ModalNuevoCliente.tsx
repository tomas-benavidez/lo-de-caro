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
    'w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ' +
    'focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:cursor-not-allowed ' +
    'transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-nuevo-cliente"
    >
      <div className="relative w-full max-w-sm bg-marca-beige rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 id="titulo-modal-nuevo-cliente" className="text-base font-bold text-marca-canela">
              Nuevo Cliente
            </h2>
            <p className="text-xs text-stone-500">Agregá un cliente habitual a la agenda</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar modal"
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

          <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2">
            <Boton
              type="button"
              variante="secundario"
              tamano="mediano"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              variante="primario"
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
