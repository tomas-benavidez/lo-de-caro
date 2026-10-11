import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MateriaPrima } from '../../domain/models/materiaPrima.ts';
import {
  NuevoGastoInput,
  CategoriaGasto,
  MetodoPagoGasto,
} from '../../domain/models/gasto.ts';
import { calcularNuevoCostoUnitario } from '../../domain/services/gastoServicio.ts';
import { Boton } from './Boton.tsx';

export interface ModalNuevoGastoProps {
  abierto: boolean;
  materiasPrimas: MateriaPrima[];
  onCerrar: () => void;
  onGuardar: (
    gasto: NuevoGastoInput,
    materiaPrimaSeleccionada?: MateriaPrima
  ) => Promise<void>;
}

const CATEGORIAS: { id: CategoriaGasto; label: string; desc: string }[] = [
  { id: 'Materia Prima', label: 'Materia Prima', desc: 'Insumos e ingredientes' },
  { id: 'Packaging', label: 'Packaging', desc: 'Cajas, bandejas y bolsas' },
  { id: 'Servicios', label: 'Servicios', desc: 'Gas, luz, agua, alquiler' },
  { id: 'Equipamiento', label: 'Equipamiento', desc: 'Máquinas y mantenimiento' },
  { id: 'Otros', label: 'Otros', desc: 'Limpieza, fletes y varios' },
];

export const ModalNuevoGasto: React.FC<ModalNuevoGastoProps> = ({
  abierto,
  materiasPrimas,
  onCerrar,
  onGuardar,
}) => {
  const [concepto, setConcepto] = useState<string>('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('Materia Prima');
  const [monto, setMonto] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPagoGasto>('Efectivo');

  // Estado para vinculación con materia prima
  const [vincularMateriaPrima, setVincularMateriaPrima] = useState<boolean>(true);
  const [materiaPrimaId, setMateriaPrimaId] = useState<string>('');
  const [cantidadComprada, setCantidadComprada] = useState<string>('');
  const [actualizarCostoUnitario, setActualizarCostoUnitario] = useState<boolean>(true);

  const [guardando, setGuardando] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const primerInputRef = useRef<HTMLInputElement>(null);

  // Inicializar formulario al abrir
  useEffect(() => {
    if (abierto) {
      setCategoria('Materia Prima');
      const mpInicial = materiasPrimas.length > 0 ? materiasPrimas[0] : null;
      setMateriaPrimaId(mpInicial ? mpInicial.id : '');
      setConcepto(mpInicial ? `Compra ${mpInicial.nombre}` : '');
      setMonto('');
      const hoy = new Date().toISOString().split('T')[0];
      setFecha(hoy);
      setMetodoPago('Efectivo');
      setVincularMateriaPrima(true);
      setCantidadComprada('');
      setActualizarCostoUnitario(true);
      setErrorValidacion(null);
      setGuardando(false);

      setTimeout(() => primerInputRef.current?.focus(), 60);

      const manejarKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !guardando) {
          onCerrar();
        }
      };
      window.addEventListener('keydown', manejarKeyDown);
      return () => window.removeEventListener('keydown', manejarKeyDown);
    }
  }, [abierto, materiasPrimas, guardando, onCerrar]);

  // Materia prima seleccionada
  const materiaPrimaSeleccionada = useMemo(() => {
    return materiasPrimas.find((m) => m.id === materiaPrimaId);
  }, [materiasPrimas, materiaPrimaId]);

  // Si cambia la materia prima seleccionada y el concepto está vacío, autocompletar sugerencia
  const handleCambioMateriaPrima = (id: string) => {
    setMateriaPrimaId(id);
    const mp = materiasPrimas.find((m) => m.id === id);
    if (mp && (!concepto || concepto.startsWith('Compra '))) {
      setConcepto(`Compra ${mp.nombre}`);
    }
  };

  // Cálculo en vivo del nuevo costo y nuevo stock
  const calculoImpacto = useMemo(() => {
    if (!vincularMateriaPrima || !materiaPrimaSeleccionada) {
      return null;
    }
    const montoNum = parseFloat(monto) || 0;
    const cantNum = parseFloat(cantidadComprada) || 0;

    const nuevoCosto = calcularNuevoCostoUnitario(montoNum, cantNum);
    const nuevoStock = materiaPrimaSeleccionada.stockActual + cantNum;

    return {
      nuevoCosto,
      nuevoStock,
      costoActual: materiaPrimaSeleccionada.costoUnitario,
      stockActual: materiaPrimaSeleccionada.stockActual,
      unidad: materiaPrimaSeleccionada.unidadMedida,
    };
  }, [vincularMateriaPrima, materiaPrimaSeleccionada, monto, cantidadComprada]);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    const conceptoLimpio = concepto.trim();
    if (!conceptoLimpio) {
      setErrorValidacion('El concepto del gasto es obligatorio.');
      return;
    }

    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      setErrorValidacion('Ingresá un monto válido mayor a 0.');
      return;
    }

    let datosCompraMateriaPrima:
      | {
          materiaPrimaId: string;
          cantidadComprada: number;
          actualizarCostoUnitario: boolean;
        }
      | undefined;

    if (categoria === 'Materia Prima' && vincularMateriaPrima) {
      if (!materiaPrimaId) {
        setErrorValidacion('Seleccioná la materia prima a actualizar.');
        return;
      }
      const cantNum = parseFloat(cantidadComprada);
      if (!cantidadComprada || isNaN(cantNum) || cantNum <= 0) {
        setErrorValidacion('La cantidad comprada debe ser mayor a 0.');
        return;
      }

      datosCompraMateriaPrima = {
        materiaPrimaId,
        cantidadComprada: cantNum,
        actualizarCostoUnitario,
      };
    }

    const nuevoGasto: NuevoGastoInput = {
      concepto: conceptoLimpio,
      categoria,
      monto: montoNum,
      fecha: fecha || new Date().toISOString().split('T')[0],
      metodoPago,
      compraMateriaPrima: datosCompraMateriaPrima,
    };

    setGuardando(true);
    try {
      await onGuardar(nuevoGasto, materiaPrimaSeleccionada);
      onCerrar();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el gasto.';
      setErrorValidacion(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-nuevo-gasto"
    >
      <div className="relative w-full max-w-lg my-6 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="px-5 py-4 bg-marca-beige border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2
              id="titulo-modal-nuevo-gasto"
              className="text-base font-bold text-stone-900"
            >
              Nuevo Gasto o Egreso
            </h2>
            <p className="text-xs text-stone-600">
              Registrá compras de insumos, packaging o servicios del local
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar ventana"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 active:bg-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorValidacion && (
            <div
              role="alert"
              className="p-3 bg-marca-tomate/10 border border-marca-tomate/30 rounded-xl text-xs font-medium text-marca-tomate flex items-start gap-2"
            >
              <span>⚠️</span>
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Selector de Categoría */}
          <div>
            <label
              htmlFor="select-categoria-gasto"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Categoría del Gasto <span className="text-marca-tomate">*</span>
            </label>
            <select
              id="select-categoria-gasto"
              name="categoriaGasto"
              aria-label="Categoría del gasto"
              value={categoria}
              disabled={guardando}
              onChange={(e) => {
                const nuevaCat = e.target.value as CategoriaGasto;
                setCategoria(nuevaCat);
                if (nuevaCat === 'Materia Prima' && materiasPrimas.length > 0) {
                  const mp =
                    materiasPrimas.find((m) => m.id === materiaPrimaId) || materiasPrimas[0];
                  if (!concepto || concepto.startsWith('Compra ')) {
                    setConcepto(`Compra ${mp.nombre}`);
                  }
                }
              }}
              className="w-full min-h-[44px] px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 hover:border-stone-400 active:border-marca-canela focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 transition-colors"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.desc})
                </option>
              ))}
            </select>
          </div>

          {/* Bloque especial para Materia Prima */}
          {categoria === 'Materia Prima' && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  📦 Impacto en Inventario de Insumos
                </span>
                <label
                  htmlFor="checkbox-vincular-materia-prima"
                  className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 select-none"
                >
                  <input
                    id="checkbox-vincular-materia-prima"
                    name="vincularMateriaPrima"
                    aria-label="Actualizar stock de materia prima"
                    type="checkbox"
                    checked={vincularMateriaPrima}
                    disabled={guardando}
                    onChange={(e) => setVincularMateriaPrima(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-marca-canela focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela hover:border-stone-400 active:border-marca-canela disabled:opacity-50 cursor-pointer"
                  />
                  <span>Actualizar stock</span>
                </label>
              </div>

              {vincularMateriaPrima && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label
                      htmlFor="select-materia-prima"
                      className="block text-xs font-medium text-stone-700 mb-1"
                    >
                      Ingrediente comprado:
                    </label>
                    <select
                      id="select-materia-prima"
                      name="materiaPrimaId"
                      aria-label="Seleccionar materia prima"
                      value={materiaPrimaId}
                      disabled={guardando || materiasPrimas.length === 0}
                      onChange={(e) => handleCambioMateriaPrima(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 hover:border-stone-400 active:border-marca-canela focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 transition-colors"
                    >
                      {materiasPrimas.length === 0 ? (
                        <option value="">No hay materias primas cargadas</option>
                      ) : (
                        materiasPrimas.map((mp) => (
                          <option key={mp.id} value={mp.id}>
                            {mp.nombre} (Stock actual: {mp.stockActual} {mp.unidadMedida} |
                            ${mp.costoUnitario}/{mp.unidadMedida})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="input-cantidad-comprada"
                        className="block text-xs font-medium text-stone-700 mb-1"
                      >
                        Cantidad comprada ({materiaPrimaSeleccionada?.unidadMedida || 'u'}):
                      </label>
                      <input
                        id="input-cantidad-comprada"
                        name="cantidadComprada"
                        aria-label="Cantidad comprada de materia prima"
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Ej. 25"
                        value={cantidadComprada}
                        disabled={guardando}
                        onChange={(e) => setCantidadComprada(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 hover:border-stone-400 active:border-marca-canela focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 transition-colors"
                      />
                    </div>

                    <div className="flex flex-col justify-end pb-1">
                      <label
                        htmlFor="checkbox-actualizar-costo-unitario"
                        className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 select-none"
                      >
                        <input
                          id="checkbox-actualizar-costo-unitario"
                          name="actualizarCostoUnitario"
                          aria-label="Actualizar costo de compra de materia prima"
                          type="checkbox"
                          checked={actualizarCostoUnitario}
                          disabled={guardando}
                          onChange={(e) => setActualizarCostoUnitario(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-300 text-marca-canela focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela hover:border-stone-400 active:border-marca-canela disabled:opacity-50 cursor-pointer"
                        />
                        <span className="leading-tight">
                          Actualizar costo de compra
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Previsualización del cálculo */}
                  {calculoImpacto && calculoImpacto.nuevoCosto > 0 && (
                    <div className="p-2.5 bg-white border border-amber-300/80 rounded-lg text-xs space-y-1 text-stone-700">
                      <div className="flex justify-between">
                        <span>Stock resultante:</span>
                        <span className="font-semibold text-stone-900">
                          {calculoImpacto.stockActual} ➔ {calculoImpacto.nuevoStock}{' '}
                          {calculoImpacto.unidad}
                        </span>
                      </div>
                      {actualizarCostoUnitario && (
                        <div className="flex justify-between">
                          <span>Nuevo costo unitario:</span>
                          <span className="font-bold text-marca-canela">
                            ${calculoImpacto.nuevoCosto} / {calculoImpacto.unidad}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Concepto del Gasto */}
          <div>
            <label
              htmlFor="input-concepto-gasto"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Concepto / Detalle <span className="text-marca-tomate">*</span>
            </label>
            <input
              id="input-concepto-gasto"
              name="conceptoGasto"
              aria-label="Concepto o detalle del gasto"
              ref={primerInputRef}
              type="text"
              placeholder="Ej. Compra 25kg Harina 0000 Molino, Garrafa 10kg, etc."
              value={concepto}
              disabled={guardando}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 hover:border-stone-400 active:border-marca-canela focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 transition-colors"
            />
          </div>

          {/* Fila: Monto ($) y Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="input-monto-gasto"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Monto Total ($) <span className="text-marca-tomate">*</span>
              </label>
              <input
                id="input-monto-gasto"
                name="montoGasto"
                aria-label="Monto total del gasto en pesos"
                type="number"
                step="any"
                min="0"
                placeholder="Ej. 25000"
                value={monto}
                disabled={guardando}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 hover:border-stone-400 active:border-marca-canela focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="input-fecha-gasto"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Fecha
              </label>
              <input
                id="input-fecha-gasto"
                name="fechaGasto"
                aria-label="Fecha del gasto"
                type="date"
                value={fecha}
                disabled={guardando}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 hover:border-stone-400 active:border-marca-canela focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 transition-colors"
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={guardando}
                onClick={() => setMetodoPago('Efectivo')}
                className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed ${
                  metodoPago === 'Efectivo'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500 hover:bg-emerald-100 active:bg-emerald-200'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100'
                }`}
              >
                <span>💵</span>
                <span>Efectivo (Caja)</span>
              </button>

              <button
                type="button"
                disabled={guardando}
                onClick={() => setMetodoPago('Transferencia')}
                className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50 disabled:cursor-not-allowed ${
                  metodoPago === 'Transferencia'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-1 ring-blue-500 hover:bg-blue-100 active:bg-blue-200'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100'
                }`}
              >
                <span>💳</span>
                <span>Transferencia</span>
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <Boton
              type="button"
              variante="secundario"
              tamano="mediano"
              disabled={guardando}
              onClick={onCerrar}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              variante="primario"
              tamano="mediano"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Registrar Gasto'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
