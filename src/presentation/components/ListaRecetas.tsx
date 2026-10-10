import React, { useState, useMemo } from 'react';
import { Producto, CategoriaProducto } from '../../domain/models/producto.ts';
import {
  calcularCostoReceta,
  calcularMargenGanancia,
  clasificarMargen,
} from '../../domain/services/calculadorCostos.ts';
import { Boton } from './Boton.tsx';

export interface ListaRecetasProps {
  productos: Producto[];
  cargando: boolean;
  error: string | null;
  onAbrirNuevoModal: () => void;
  onEditar?: (producto: Producto) => void;
  onEliminar?: (producto: Producto) => void;
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

const CATEGORIAS_FILTRO: (CategoriaProducto | 'Todas')[] = [
  'Todas',
  'Pastas Rellenas',
  'Pastas Lisas',
  'Empanadas',
  'Tartas',
  'Salsas',
];

/**
 * Componente mobile-first para visualización, filtrado y costeo de recetas.
 * Muestra precio, costo calculado, margen en $ y % y desglose de ingredientes.
 */
export const ListaRecetas: React.FC<ListaRecetasProps> = ({
  productos,
  cargando,
  error,
  onAbrirNuevoModal,
  onEditar,
  onEliminar,
  onReintentar,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaProducto | 'Todas'>('Todas');
  const [recetasExpandidas, setRecetasExpandidas] = useState<Record<string, boolean>>({});

  const toggleExpandir = (id: string) => {
    setRecetasExpandidas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const coincideBusqueda =
        !busqueda.trim() ||
        producto.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) ||
        producto.ingredientes.some((ing) =>
          ing.nombreMateriaPrima.toLowerCase().includes(busqueda.trim().toLowerCase())
        );

      const coincideCategoria =
        categoriaSeleccionada === 'Todas' || producto.categoria === categoriaSeleccionada;

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoriaSeleccionada]);

  if (cargando) {
    return (
      <div className="space-y-3 py-6" role="status" aria-label="Cargando recetas y costos">
        <div className="h-10 bg-stone-200 animate-pulse rounded-lg" />
        <div className="h-24 bg-stone-200 animate-pulse rounded-lg" />
        <div className="h-24 bg-stone-200 animate-pulse rounded-lg" />
        <span className="sr-only">Cargando recetas y costos...</span>
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
    <section className="space-y-4" aria-label="Módulo de Recetas y Costeo">
      {/* Encabezado y acciones principales */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Recetas y Costeo</h2>
          <p className="text-xs text-stone-600">
            {productos.length} {productos.length === 1 ? 'receta registrada' : 'recetas registradas'}
          </p>
        </div>

        <Boton
          variante="primario"
          tamano="mediano"
          onClick={onAbrirNuevoModal}
          className="w-full sm:w-auto"
          aria-label="Registrar nueva receta de producto"
        >
          + Nueva Receta
        </Boton>
      </div>

      {/* Buscador accesible con los 5 estados */}
      <div className="relative">
        <label htmlFor="buscador-recetas" className="sr-only">
          Buscar receta o ingrediente
        </label>
        <input
          id="buscador-recetas"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar receta o ingrediente (ej. Raviolones, Espinaca...)"
          className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white text-stone-900 border border-stone-300 placeholder-stone-400 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Filtro por Categorías Mobile-First */}
      <div
        className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none"
        role="group"
        aria-label="Filtrar por categoría"
      >
        {CATEGORIAS_FILTRO.map((cat) => {
          const seleccionada = categoriaSeleccionada === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaSeleccionada(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                seleccionada
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 active:bg-stone-200'
              }`}
              aria-pressed={seleccionada}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Listado de Productos y Recetas */}
      {productosFiltrados.length === 0 ? (
        <div className="text-center py-10 px-4 bg-white rounded-xl border border-stone-200">
          <p className="text-stone-700 font-medium text-sm">
            {busqueda || categoriaSeleccionada !== 'Todas'
              ? 'No se encontraron recetas con los filtros aplicados'
              : 'Todavía no hay recetas registradas'}
          </p>
          <p className="text-stone-500 text-xs mt-1">
            {busqueda || categoriaSeleccionada !== 'Todas'
              ? 'Probá modificando o limpiando los criterios de búsqueda'
              : 'Estandarizá tu primer plato vinculando ingredientes y precios'}
          </p>
          {!busqueda && categoriaSeleccionada === 'Todas' && (
            <Boton
              variante="primario"
              tamano="chico"
              onClick={onAbrirNuevoModal}
              className="mt-4"
            >
              Cargar primera receta
            </Boton>
          )}
        </div>
      ) : (
        <ul
          className="divide-y divide-stone-200 bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm"
          role="list"
        >
          {productosFiltrados.map((producto) => {
            const costoProduccion = calcularCostoReceta(producto.ingredientes);
            const { margenPesos, margenPorcentaje } = calcularMargenGanancia(
              producto.precioLista,
              costoProduccion
            );
            const estadoMargen = clasificarMargen(margenPorcentaje, margenPesos);
            const expandida = Boolean(recetasExpandidas[producto.id]);

            return (
              <li
                key={producto.id}
                className="p-3.5 space-y-3 hover:bg-stone-50/60 transition-colors"
              >
                {/* Cabecera del Producto */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-stone-900 text-base leading-snug">
                      {producto.nombre}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-stone-500 font-medium">
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                        {producto.categoria}
                      </span>
                      <span>•</span>
                      <span>Por {producto.unidadVenta}</span>
                      <span>•</span>
                      <span>{producto.ingredientes.length} {producto.ingredientes.length === 1 ? 'ingrediente' : 'ingredientes'}</span>
                    </div>
                  </div>

                  {/* Acciones de Edición y Baja */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onEditar && (
                      <Boton
                        type="button"
                        variante="secundario"
                        tamano="chico"
                        onClick={() => onEditar(producto)}
                        aria-label={`Editar receta ${producto.nombre}`}
                      >
                        Editar
                      </Boton>
                    )}
                    {onEliminar && (
                      <Boton
                        type="button"
                        variante="peligro"
                        tamano="chico"
                        onClick={() => onEliminar(producto)}
                        aria-label={`Eliminar receta ${producto.nombre}`}
                      >
                        Eliminar
                      </Boton>
                    )}
                  </div>
                </div>

                {/* Métricas Financieras (Precio, Costo, Margen) */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 text-center">
                  <div>
                    <span className="block text-[11px] text-stone-500 font-medium">
                      Precio Venta
                    </span>
                    <strong className="text-sm font-bold text-stone-900">
                      {formatearMoneda(producto.precioLista)}
                    </strong>
                  </div>

                  <div className="border-x border-stone-200/80 px-1">
                    <span className="block text-[11px] text-stone-500 font-medium">
                      Costo Insumos
                    </span>
                    <strong className="text-sm font-bold text-stone-700">
                      {formatearMoneda(costoProduccion)}
                    </strong>
                  </div>

                  <div>
                    <span className="block text-[11px] text-stone-500 font-medium">
                      Margen ({margenPorcentaje}%)
                    </span>
                    <strong
                      className={`text-sm font-bold ${
                        estadoMargen === 'SALUDABLE'
                          ? 'text-emerald-700'
                          : estadoMargen === 'ADVERTENCIA'
                          ? 'text-marca-otono'
                          : 'text-marca-tomate'
                      }`}
                    >
                      {formatearMoneda(margenPesos)}
                    </strong>
                  </div>
                </div>

                {/* Semáforo de Margen / Alerta */}
                {estadoMargen === 'PERDIDA' && (
                  <div
                    role="status"
                    className="flex items-center gap-1.5 text-xs font-semibold text-marca-tomate bg-red-50 border border-marca-tomate/30 px-2.5 py-1.5 rounded-md"
                  >
                    <span>⚠️ ¡Alerta! El costo de producción supera el precio de venta.</span>
                  </div>
                )}

                {estadoMargen === 'ADVERTENCIA' && (
                  <div
                    role="status"
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-md"
                  >
                    <span>Margen ajustado (menor al 30%). Conviene revisar precios de lista o costos.</span>
                  </div>
                )}

                {/* Botón para expandir/colapsar desglose de ingredientes */}
                {producto.ingredientes.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpandir(producto.id)}
                      aria-expanded={expandida}
                      className="text-xs font-semibold text-marca-canela hover:text-stone-900 active:text-stone-950 flex items-center gap-1 py-1 px-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela"
                    >
                      <span>{expandida ? '▼ Ocultar fórmula de receta' : '▶ Ver fórmula de receta (' + producto.ingredientes.length + ' insumos)'}</span>
                    </button>

                    {expandida && (
                      <div className="mt-2 pl-2 border-l-2 border-marca-canela/40 space-y-1.5 text-xs text-stone-700">
                        {producto.ingredientes.map((ing) => {
                          const subtotal = ing.cantidad * ing.costoUnitario;
                          return (
                            <div
                              key={ing.id || ing.materiaPrimaId}
                              className="flex justify-between items-center py-1 border-b border-stone-100 last:border-0"
                            >
                              <div>
                                <span className="font-semibold text-stone-800">
                                  {ing.nombreMateriaPrima}
                                </span>
                                <span className="text-stone-500 ml-1.5">
                                  ({ing.cantidad} {ing.unidadMedida} a {formatearMoneda(ing.costoUnitario)}/{ing.unidadMedida})
                                </span>
                              </div>
                              <span className="font-medium text-stone-900">
                                {formatearMoneda(subtotal)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
