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
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    'w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 placeholder:text-stone-400 ' +
    'hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ' +
    'focus-visible:border-marca-canela active:border-marca-canela disabled:bg-stone-100 disabled:cursor-not-allowed ' +
    'transition-colors';

  const montoNumerico = parseFloat(monto) || 0;
  const saldoRestante = Math.max(0, cliente.saldoPendiente - montoNumerico);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-cobrar-deuda"
    >
      <div className="relative w-full max-w-sm bg-marca-beige rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 id="titulo-modal-cobrar-deuda" className="text-base font-bold text-marca-canela">
              Registrar Cobro
            </h2>
            <p className="text-xs text-stone-500">Cobranza de cuenta corriente</p>
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
