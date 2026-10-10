import React, { useState, useMemo } from 'react';
import { MateriaPrima } from '../../domain/models/materiaPrima.ts';
import { evaluarEstadoStock } from '../../domain/services/calculadorCostos.ts';
import { Boton } from './Boton.tsx';

export interface ListaMateriasPrimasProps {
  materiasPrimas: MateriaPrima[];
  cargando: boolean;
  error: string | null;
  onAbrirNuevoModal: () => void;
  onEditar?: (materiaPrima: MateriaPrima) => void;
  onEliminar?: (materiaPrima: MateriaPrima) => void;
  onReintentar?: () => void;
}

/**
 * Formatea valores numéricos a moneda argentina ($ 1.250,50).
 */
function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Componente mobile-first para la visualización y filtrado de materias primas.
 * Evita tarjetas anidadas y garantiza contraste accesible WCAG AA.
 */
export const ListaMateriasPrimas: React.FC<ListaMateriasPrimasProps> = ({
  materiasPrimas,
  cargando,
  error,
  onAbrirNuevoModal,
  onEditar,
  onEliminar,
  onReintentar,
}) => {
  const [busqueda, setBusqueda] = useState('');

  const materiasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return materiasPrimas;
    return materiasPrimas.filter((m) => m.nombre.toLowerCase().includes(termino));
  }, [materiasPrimas, busqueda]);

  const cantidadReponer = useMemo(() => {
    return materiasPrimas.filter((m) => evaluarEstadoStock(m.stockActual, m.stockMinimo) === 'REPONER').length;
  }, [materiasPrimas]);

  if (cargando) {
    return (
      <div className="space-y-3 py-6" role="status" aria-label="Cargando materias primas">
        <div className="h-10 bg-stone-200 animate-pulse rounded-lg" />
        <div className="h-20 bg-stone-200 animate-pulse rounded-lg" />
        <div className="h-20 bg-stone-200 animate-pulse rounded-lg" />
        <span className="sr-only">Cargando materias primas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-marca-tomate/30 rounded-xl text-stone-900 space-y-3 my-4"
      >
        <p className="font-semibold text-marca-tomate text-sm">Error de conexión</p>
        <p className="text-xs text-stone-700">{error}</p>
        {onReintentar && (
          <Boton variante="secundario" tamano="chico" onClick={onReintentar}>
            Reintentar
          </Boton>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Módulo de Materias Primas">
      {/* Encabezado y acciones principales */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Materias Primas</h2>
          <p className="text-xs text-stone-600">
            {materiasPrimas.length} {materiasPrimas.length === 1 ? 'insumo registrado' : 'insumos registrados'}
            {cantidadReponer > 0 && (
              <span className="ml-2 font-semibold text-marca-tomate">
                • {cantidadReponer} para reponer
              </span>
            )}
          </p>
        </div>

        <Boton
          variante="primario"
          tamano="mediano"
          onClick={onAbrirNuevoModal}
          className="w-full sm:w-auto"
          aria-label="Registrar nueva materia prima"
        >
          + Nuevo Insumo
        </Boton>
      </div>

      {/* Buscador accesible con 5 estados */}
      <div className="relative">
        <label htmlFor="buscador-materias-primas" className="sr-only">
          Buscar materia prima por nombre
        </label>
        <input
          id="buscador-materias-primas"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar ingrediente (ej. Harina, Ricotta...)"
          className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white text-stone-900 border border-stone-300 placeholder-stone-400 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Listado limpio mobile-first */}
      {materiasFiltradas.length === 0 ? (
        <div className="text-center py-10 px-4 bg-white rounded-xl border border-stone-200">
          <p className="text-stone-700 font-medium text-sm">
            {busqueda ? 'No se encontraron insumos con ese nombre' : 'Todavía no hay materias primas registradas'}
          </p>
          <p className="text-stone-500 text-xs mt-1">
            {busqueda
              ? 'Probá borrando el filtro de búsqueda'
              : 'Agregá los ingredientes para poder costear tus recetas'}
          </p>
          {!busqueda && (
            <Boton
              variante="primario"
              tamano="chico"
              onClick={onAbrirNuevoModal}
              className="mt-4"
            >
              Cargar primer insumo
            </Boton>
          )}
        </div>
      ) : (
        <ul
          className="divide-y divide-stone-200 bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm"
          role="list"
        >
          {materiasFiltradas.map((item) => {
            const estado = evaluarEstadoStock(item.stockActual, item.stockMinimo);
            const necesitaReposicion = estado === 'REPONER';

            return (
              <li
                key={item.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-900 text-sm truncate">
                      {item.nombre}
                    </span>
                    {necesitaReposicion ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-marca-tomate border border-marca-tomate/30"
                        role="status"
                        aria-label="Stock bajo: requiere reposición"
                      >
                        REPONER
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                        role="status"
                        aria-label="Stock suficiente"
                      >
                        OK
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600">
                    Stock:{' '}
                    <strong className={necesitaReposicion ? 'text-marca-tomate' : 'text-stone-800'}>
                      {item.stockActual} {item.unidadMedida}
                    </strong>{' '}
                    <span className="text-stone-400">|</span> Mín: {item.stockMinimo} {item.unidadMedida}
                  </p>
                </div>

                {/* Precio y acciones con los 5 estados obligatorios */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-stone-100 sm:border-t-0">
                  <div className="text-left sm:text-right whitespace-nowrap">
                    <div className="text-sm font-bold text-stone-900">
                      {formatearMoneda(item.costoUnitario)}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      por {item.unidadMedida}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onEditar && (
                      <Boton
                        type="button"
                        variante="secundario"
                        tamano="chico"
                        onClick={() => onEditar(item)}
                        aria-label={`Editar ${item.nombre}`}
                      >
                        Editar
                      </Boton>
                    )}

                    {onEliminar && (
                      <Boton
                        type="button"
                        variante="peligro"
                        tamano="chico"
                        onClick={() => onEliminar(item)}
                        aria-label={`Eliminar ${item.nombre}`}
                      >
                        Eliminar
                      </Boton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
