import React, { useState, useEffect, useRef } from 'react';
import { Cliente, RegistroPagoClienteInput } from '../../domain/models/cliente.ts';
import { MetodoPago } from '../../domain/models/venta.ts';
import { Boton } from './Boton.tsx';

export interface ModalCobrarDeudaProps {
  abierto: boolean;
  cliente: Cliente | null;
  onCerrar: () => void;
  onGuardar: (pago: RegistroPagoClienteInput) => Promise<void>;
}

export const ModalCobrarDeuda: React.FC<ModalCobrarDeudaProps> = ({
  abierto,
  cliente,
  onCerrar,
  onGuardar,
}) => {
  const [monto, setMonto] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [observaciones, setObservaciones] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const inputMontoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto && cliente) {
      setMonto(cliente.saldoPendiente > 0 ? cliente.saldoPendiente.toString() : '');
      setMetodoPago('Efectivo');
      setObservaciones('');
      setErrorValidacion(null);
      setTimeout(() => {
        inputMontoRef.current?.focus();
      }, 50);
    }
  }, [abierto, cliente]);

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
    if (!cliente) return;

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorValidacion('El monto a abonar debe ser mayor a cero.');
      return;
    }

    if (montoNum > cliente.saldoPendiente) {
      setErrorValidacion(
        `El monto ($${montoNum.toLocaleString('es-AR')}) no puede ser mayor a la deuda total ($${cliente.saldoPendiente.toLocaleString('es-AR')}).`
      );
      return;
    }

    setGuardando(true);
    setErrorValidacion(null);
    try {
      await onGuardar({
        clienteId: cliente.id,
        monto: montoNum,
        metodoPago,
        observaciones: observaciones.trim() || undefined,
      });
      onCerrar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar el cobro.';
      setErrorValidacion(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto || !cliente) return null;

  const estiloInput =
    'w-full bg-white border border-stone-300 rounded-xl p-2.5 text-sm text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-marca-canela active:border-marca-canela ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela ' +
    'disabled:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed ' +
    'transition-all duration-150';

  const montoNumerico = parseFloat(monto) || 0;
  const saldoRestante = Math.max(0, cliente.saldoPendiente - montoNumerico);

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-cobrar-deuda"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 id="titulo-modal-cobrar-deuda" className="font-titular font-bold text-stone-900 text-lg sm:text-xl">
                Registrar Cobro
              </h2>
              <p className="text-xs text-stone-500">Cobranza de cuenta corriente</p>
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

          {/* Tarjeta de información del cliente */}
          <div className="bg-white rounded-xl p-3 border border-stone-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">{cliente.nombreApellido}</span>
              <span className="text-[11px] font-semibold text-marca-tomate bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Debe ${cliente.saldoPendiente.toLocaleString('es-AR')}
              </span>
            </div>
            {cliente.telefono && (
              <p className="text-[11px] text-stone-500">Tel: {cliente.telefono}</p>
            )}
          </div>

          {/* Monto a cobrar con botón rápido */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="input-monto-cobro" className="text-xs font-bold text-stone-700">
                Monto a Cobrar ($) *
              </label>
              <button
                type="button"
                onClick={() => setMonto(cliente.saldoPendiente.toString())}
                disabled={guardando}
                className="text-[11px] text-marca-canela font-semibold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca-canela rounded px-1"
              >
                Cobrar todo (${cliente.saldoPendiente.toLocaleString('es-AR')})
              </button>
            </div>
            <input
              id="input-monto-cobro"
              name="monto"
              ref={inputMontoRef}
              type="number"
              min="1"
              step="any"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              disabled={guardando}
              className={estiloInput}
              required
            />
            {montoNumerico > 0 && (
              <p className="text-[11px] text-stone-500 mt-1">
                Saldo restante proyectado:{' '}
                <span className="font-semibold text-stone-800">
                  ${saldoRestante.toLocaleString('es-AR')}
                </span>
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Método de Pago *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMetodoPago('Efectivo')}
                disabled={guardando}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                  metodoPago === 'Efectivo'
                    ? 'bg-marca-canela text-white border-marca-canela shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400 active:bg-stone-50'
                }`}
              >
                💵 Efectivo
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('Transferencia')}
                disabled={guardando}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                  metodoPago === 'Transferencia'
                    ? 'bg-marca-canela text-white border-marca-canela shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400 active:bg-stone-50'
                }`}
              >
                📱 Transferencia
              </button>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="input-notas-cobro" className="block text-xs font-bold text-stone-700 mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <input
              id="input-notas-cobro"
              name="observaciones"
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Pago parcial fin de semana"
              disabled={guardando}
              className={estiloInput}
            />
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
              disabled={guardando || !monto || parseFloat(monto) <= 0}
            >
              {guardando ? 'Registrando...' : 'Confirmar Cobro'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
