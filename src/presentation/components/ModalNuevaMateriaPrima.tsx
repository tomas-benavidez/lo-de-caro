import React, { useState, useEffect, useRef } from 'react';
import { MateriaPrima, UnidadMedida } from '../../domain/models/materiaPrima.ts';
import { NuevaMateriaPrimaInput } from '../../infrastructure/repositories/materiaPrimaRepositorio.ts';
import { Boton } from './Boton.tsx';

export interface ModalNuevaMateriaPrimaProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (datos: NuevaMateriaPrimaInput) => Promise<void>;
  materiaPrimaAEditar?: MateriaPrima | null;
}

/**
 * Modal accesible para registrar o editar una materia prima con los 5 estados UI obligatorios.
 */
export const ModalNuevaMateriaPrima: React.FC<ModalNuevaMateriaPrimaProps> = ({
  abierto,
  onCerrar,
  onGuardar,
  materiaPrimaAEditar = null,
}) => {
  const [nombre, setNombre] = useState('');
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>('g');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const primerInputRef = useRef<HTMLInputElement>(null);
  const esEdicion = Boolean(materiaPrimaAEditar);

  // Inicialización de campos, foco inicial y manejo de tecla Escape
  useEffect(() => {
    if (abierto) {
      setErrorValidacion(null);
      if (materiaPrimaAEditar) {
        setNombre(materiaPrimaAEditar.nombre);
        setUnidadMedida(materiaPrimaAEditar.unidadMedida);
        setCostoUnitario(materiaPrimaAEditar.costoUnitario.toString());
        setStockActual(materiaPrimaAEditar.stockActual.toString());
        setStockMinimo(materiaPrimaAEditar.stockMinimo.toString());
      } else {
        setNombre('');
        setUnidadMedida('g');
        setCostoUnitario('');
        setStockActual('');
        setStockMinimo('');
      }

      setTimeout(() => primerInputRef.current?.focus(), 50);

      const manejarKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !guardando) {
          onCerrar();
        }
      };

      window.addEventListener('keydown', manejarKeyDown);
      return () => window.removeEventListener('keydown', manejarKeyDown);
    }
  }, [abierto, materiaPrimaAEditar, guardando, onCerrar]);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setErrorValidacion('El nombre del insumo es obligatorio.');
      primerInputRef.current?.focus();
      return;
    }

    const costo = parseFloat(costoUnitario);
    if (isNaN(costo) || costo < 0) {
      setErrorValidacion('El costo unitario debe ser un número mayor o igual a 0.');
      return;
    }

    const stockAct = stockActual.trim() === '' ? 0 : parseFloat(stockActual);
    if (isNaN(stockAct) || stockAct < 0) {
      setErrorValidacion('El stock actual no puede ser negativo.');
      return;
    }

    const stockMin = stockMinimo.trim() === '' ? 0 : parseFloat(stockMinimo);
    if (isNaN(stockMin) || stockMin < 0) {
      setErrorValidacion('El stock mínimo no puede ser negativo.');
      return;
    }

    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombreLimpio,
        unidadMedida,
        costoUnitario: costo,
        stockActual: stockAct,
        stockMinimo: stockMin,
      });

      // Limpiar y cerrar
      setNombre('');
      setCostoUnitario('');
      setStockActual('');
      setStockMinimo('');
      setUnidadMedida('g');
      onCerrar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar la materia prima.';
      setErrorValidacion(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const estilosInput =
    'w-full px-3 py-2 text-sm rounded-lg bg-white text-stone-900 border border-stone-300 ' +
    'placeholder-stone-400 transition-colors duration-150 ' +
    'hover:border-marca-canela active:border-marca-canela ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela ' +
    'disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h2 id="modal-titulo" className="text-base font-bold text-stone-900">
              {esEdicion ? 'Editar Materia Prima' : 'Nueva Materia Prima'}
            </h2>
            <p className="text-xs text-stone-500">
              {esEdicion
                ? 'Modificá el costo unitario o realizá ajustes en el stock'
                : 'Registrá un ingrediente para costear recetas y controlar stock'}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar modal"
            className="text-stone-400 hover:text-stone-700 active:text-stone-900 p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorValidacion && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-marca-tomate/40 rounded-lg text-xs text-marca-tomate font-medium"
            >
              {errorValidacion}
            </div>
          )}

          <div>
            <label htmlFor="input-nombre" className="block text-xs font-semibold text-stone-800 mb-1">
              Nombre del Insumo <span className="text-marca-tomate">*</span>
            </label>
            <input
              ref={primerInputRef}
              id="input-nombre"
              type="text"
              required
              disabled={guardando}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Harina 0000, Ricotta, Sal..."
              className={estilosInput}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-unidad" className="block text-xs font-semibold text-stone-800 mb-1">
                Unidad de Medida
              </label>
              <select
                id="input-unidad"
                disabled={guardando}
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value as UnidadMedida)}
                className={estilosInput}
              >
                <option value="g">Gramos (g)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="l">Litros (l)</option>
                <option value="u">Unidades (u)</option>
              </select>
            </div>

            <div>
              <label htmlFor="input-costo" className="block text-xs font-semibold text-stone-800 mb-1">
                Costo por {unidadMedida} ($) <span className="text-marca-tomate">*</span>
              </label>
              <input
                id="input-costo"
                type="number"
                step="0.01"
                min="0"
                required
                disabled={guardando}
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(e.target.value)}
                placeholder="0.00"
                className={estilosInput}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-stock-actual" className="block text-xs font-semibold text-stone-800 mb-1">
                {esEdicion ? 'Stock Actual' : 'Stock Inicial'} ({unidadMedida})
              </label>
              <input
                id="input-stock-actual"
                type="number"
                step="any"
                min="0"
                disabled={guardando}
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                placeholder="0"
                className={estilosInput}
              />
            </div>

            <div>
              <label htmlFor="input-stock-minimo" className="block text-xs font-semibold text-stone-800 mb-1">
                Alerta Mínima ({unidadMedida})
              </label>
              <input
                id="input-stock-minimo"
                type="number"
                step="any"
                min="0"
                disabled={guardando}
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                placeholder="0"
                className={estilosInput}
              />
            </div>
          </div>

          <p className="text-[11px] text-stone-500 pt-1">
            * Se mostrará la alerta <span className="font-semibold text-marca-tomate">REPONER</span> cuando el stock sea menor o igual al mínimo.
          </p>

          {/* Acciones */}
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
              {guardando
                ? 'Guardando...'
                : esEdicion
                ? 'Guardar Cambios'
                : 'Guardar Insumo'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
