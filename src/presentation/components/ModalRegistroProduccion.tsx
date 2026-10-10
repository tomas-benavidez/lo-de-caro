import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Producto } from '../../domain/models/producto.ts';
import { MateriaPrima } from '../../domain/models/materiaPrima.ts';
import { NuevoLoteProduccionInput } from '../../infrastructure/repositories/loteProduccionRepositorio.ts';
import { calcularConsumoIngredientes } from '../../domain/services/produccionServicio.ts';
import { Boton } from './Boton.tsx';

export interface ModalRegistroProduccionProps {
  abierto: boolean;
  productoIdInicial?: string | null;
  productos: Producto[];
  materiasPrimas: MateriaPrima[];
  onCerrar: () => void;
  onGuardar: (
    lote: NuevoLoteProduccionInput,
    ingredientes: Producto['ingredientes']
  ) => Promise<void>;
}

/**
 * Modal accesible para registrar una tanda de producción cocinada.
 * Descuenta automáticamente materias primas de la receta y suma unidades al freezer.
 * Cumple estrictamente con los 5 estados en cada control interactivo.
 */
export const ModalRegistroProduccion: React.FC<ModalRegistroProduccionProps> = ({
  abierto,
  productoIdInicial = null,
  productos,
  materiasPrimas,
  onCerrar,
  onGuardar,
}) => {
  // Productos que tienen al menos un ingrediente en su receta
  const productosConReceta = useMemo(() => {
    return productos.filter((p) => p.ingredientes && p.ingredientes.length > 0);
  }, [productos]);

  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<string>('');
  const [cantidadElaborada, setCantidadElaborada] = useState<string>('5');
  const [fecha, setFecha] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [confirmarStockInsuficiente, setConfirmarStockInsuficiente] = useState<boolean>(false);

  const [guardando, setGuardando] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const selectorProductoRef = useRef<HTMLSelectElement>(null);

  // Inicialización de valores al abrir el modal
  useEffect(() => {
    if (abierto) {
      setErrorValidacion(null);
      setConfirmarStockInsuficiente(false);
      setObservaciones('');

      // Fecha actual en formato YYYY-MM-DD
      const hoy = new Date().toISOString().split('T')[0];
      setFecha(hoy);

      if (productoIdInicial && productosConReceta.some((p) => p.id === productoIdInicial)) {
        setProductoSeleccionadoId(productoIdInicial);
      } else if (productosConReceta.length > 0) {
        setProductoSeleccionadoId(productosConReceta[0].id);
      } else {
        setProductoSeleccionadoId('');
      }

      setCantidadElaborada('5');

      setTimeout(() => {
        selectorProductoRef.current?.focus();
      }, 50);
    }
  }, [abierto, productoIdInicial, productos, productosConReceta]);

  // Manejo de la tecla Escape para accesibilidad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto && !guardando) {
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, guardando, onCerrar]);

  // Producto actualmente seleccionado
  const productoSeleccionado = useMemo(() => {
    return productos.find((p) => p.id === productoSeleccionadoId) || null;
  }, [productos, productoSeleccionadoId]);

  // Cantidad numérica procesada
  const cantidadNumerica = useMemo(() => {
    const parsed = parseFloat(cantidadElaborada);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [cantidadElaborada]);

  // Simulador de consumo de ingredientes en vivo
  const resumenConsumo = useMemo(() => {
    if (!productoSeleccionado) return null;
    return calcularConsumoIngredientes(
      productoSeleccionado.id,
      productoSeleccionado.ingredientes,
      cantidadNumerica,
      materiasPrimas
    );
  }, [productoSeleccionado, cantidadNumerica, materiasPrimas]);

  if (!abierto) return null;

  const handleSumarCantidad = (delta: number) => {
    const actual = parseFloat(cantidadElaborada) || 0;
    const nueva = Math.max(1, actual + delta);
    setCantidadElaborada(nueva.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!productoSeleccionadoId) {
      setErrorValidacion('Por favor seleccioná el plato que vas a cocinar.');
      return;
    }

    if (!cantidadNumerica || cantidadNumerica <= 0) {
      setErrorValidacion('La cantidad elaborada debe ser mayor a cero.');
      return;
    }

    if (!productoSeleccionado || productoSeleccionado.ingredientes.length === 0) {
      setErrorValidacion('Este producto no tiene ingredientes cargados en su receta.');
      return;
    }

    if (resumenConsumo?.hayStockInsuficiente && !confirmarStockInsuficiente) {
      setErrorValidacion(
        'Uno o más insumos no tienen stock suficiente. Marcá la casilla de confirmación si deseás registrar el lote de todos modos.'
      );
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(
        {
          productoId: productoSeleccionadoId,
          cantidadElaborada: cantidadNumerica,
          fecha: fecha || new Date().toISOString().split('T')[0],
          observaciones: observaciones.trim() || undefined,
        },
        productoSeleccionado.ingredientes
      );
      onCerrar();
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al registrar el lote de producción.';
      setErrorValidacion(mensaje);
    } finally {
      setGuardando(false);
    }
  };

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
      aria-labelledby="titulo-modal-produccion"
    >
      <div className="relative w-full max-w-lg bg-marca-beige rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 id="titulo-modal-produccion" className="text-base font-bold text-marca-canela">
              Cocinar Lote de Producción
            </h2>
            <p className="text-xs text-stone-500">
              Descuenta materias primas y suma producto al freezer
            </p>
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

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorValidacion && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-marca-tomate/40 rounded-xl text-xs text-marca-tomate font-medium space-y-1"
            >
              <p className="font-bold">Atención requerida:</p>
              <p>{errorValidacion}</p>
            </div>
          )}

          {/* 1. Selector de Producto */}
          <div>
            <label
              htmlFor="selector-producto"
              className="block text-xs font-bold text-stone-700 mb-1"
            >
              Plato a Elaborar *
            </label>
            {productosConReceta.length === 0 ? (
              <div className="p-3 bg-orange-50 border border-marca-otono/30 rounded-lg text-xs text-stone-700">
                No hay productos con receta creada. Primero creá una receta en la solapa "Recetas".
              </div>
            ) : (
              <select
                id="selector-producto"
                name="productoId"
                ref={selectorProductoRef}
                value={productoSeleccionadoId}
                onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                disabled={guardando}
                className={estiloInput}
                required
              >
                <option value="" disabled>
                  Seleccionar plato...
                </option>
                {productosConReceta.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.categoria}) — Stock actual: {p.stockActual} {p.unidadVenta}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Cantidad elaborada con botones de ajuste rápido */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="input-cantidad" className="text-xs font-bold text-stone-700">
                Cantidad a Cocinar{' '}
                {productoSeleccionado && `(${productoSeleccionado.unidadVenta})`} *
              </label>
              <span className="text-[11px] text-stone-500">Ajuste rápido:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="input-cantidad"
                name="cantidadElaborada"
                type="number"
                min="0.1"
                step="any"
                value={cantidadElaborada}
                onChange={(e) => setCantidadElaborada(e.target.value)}
                disabled={guardando}
                placeholder="Ej. 10"
                className={`${estiloInput} text-base font-bold text-center flex-1`}
                required
              />

              <div className="flex gap-1 shrink-0">
                {[1, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSumarCantidad(num)}
                    disabled={guardando}
                    className="min-h-[44px] min-w-[44px] px-2 py-1 text-xs font-bold bg-white hover:bg-stone-100 active:bg-stone-200 border border-stone-300 rounded-lg text-stone-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Fecha y Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-fecha" className="block text-xs font-bold text-stone-700 mb-1">
                Fecha de Elaboración *
              </label>
              <input
                id="input-fecha"
                name="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                disabled={guardando}
                className={estiloInput}
                required
              />
            </div>

            <div>
              <label htmlFor="input-notas" className="block text-xs font-bold text-stone-700 mb-1">
                Observaciones (opcional)
              </label>
              <input
                id="input-notas"
                name="observaciones"
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={guardando}
                placeholder="Ej. Rindió 2 unidades extra"
                className={estiloInput}
              />
            </div>
          </div>

          {/* 4. Simulador en Vivo de Materias Primas a Consumir */}
          {resumenConsumo && resumenConsumo.ingredientes.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-800">
                  Insumos a descontar según receta
                </span>
                <span className="text-[11px] text-stone-500">
                  {resumenConsumo.ingredientes.length} materias primas
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {resumenConsumo.ingredientes.map((ing) => (
                  <div
                    key={ing.materiaPrimaId}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                      ing.insuficiente
                        ? 'bg-red-50 border border-marca-tomate/30 text-stone-900'
                        : 'bg-stone-50 border border-stone-100 text-stone-800'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-stone-900">{ing.nombreMateriaPrima}</p>
                      <p className="text-[11px] text-stone-500">
                        Por unidad: {ing.cantidadRequeridaPorUnidad} {ing.unidadMedida} • En alacena:{' '}
                        {ing.stockActualDisponible} {ing.unidadMedida}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-bold ${
                          ing.insuficiente ? 'text-marca-tomate' : 'text-stone-900'
                        }`}
                      >
                        -{ing.cantidadTotalConsumida} {ing.unidadMedida}
                      </span>
                      <p
                        className={`text-[10px] font-medium ${
                          ing.insuficiente ? 'text-marca-tomate font-bold' : 'text-stone-500'
                        }`}
                      >
                        {ing.insuficiente
                          ? `Faltan ${Math.abs(ing.stockRemanenteProyectado)} ${ing.unidadMedida}`
                          : `Quedan ${ing.stockRemanenteProyectado} ${ing.unidadMedida}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advertencia si hay stock insuficiente */}
              {resumenConsumo.hayStockInsuficiente && (
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <div className="p-2.5 bg-orange-50 border border-marca-otono/30 rounded-lg text-xs text-stone-800 flex items-start gap-2">
                    <span className="text-marca-otono font-bold text-sm leading-none">⚠️</span>
                    <div>
                      <p className="font-bold text-stone-900">Stock de insumos ajustado</p>
                      <p className="text-[11px] text-stone-600">
                        Uno o más ingredientes no alcanzan en la alacena. Si ya cocinaste el lote en
                        la realidad, podés forzar la confirmación para asentar el freezer.
                      </p>
                    </div>
                  </div>

                  <label
                    htmlFor="checkbox-confirmar-stock"
                    className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-stone-800 font-medium"
                  >
                    <input
                      id="checkbox-confirmar-stock"
                      name="confirmarStockInsuficiente"
                      type="checkbox"
                      checked={confirmarStockInsuficiente}
                      onChange={(e) => setConfirmarStockInsuficiente(e.target.checked)}
                      disabled={guardando}
                      className="rounded border-stone-300 text-marca-canela hover:border-marca-canela active:border-marca-canela focus:ring-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed h-4 w-4 transition-colors"
                    />
                    <span>Confirmo que cociné el lote a pesar del stock negativo proyectado</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
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
              disabled={guardando || productosConReceta.length === 0}
            >
              {guardando ? 'Guardando...' : 'Asentar Producción'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
