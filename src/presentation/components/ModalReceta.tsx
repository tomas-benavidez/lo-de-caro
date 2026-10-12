import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Producto,
  CategoriaProducto,
  UnidadVenta,
  RecetaIngredienteItem,
} from '../../domain/models/producto.ts';
import { MateriaPrima } from '../../domain/models/materiaPrima.ts';
import {
  NuevoProductoInput,
  NuevoIngredienteRecetaInput,
} from '../../infrastructure/repositories/productoRepositorio.ts';
import {
  calcularCostoReceta,
  calcularMargenGanancia,
  clasificarMargen,
} from '../../domain/services/calculadorCostos.ts';
import { Boton } from './Boton.tsx';

export interface ModalRecetaProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (
    producto: NuevoProductoInput,
    ingredientes: NuevoIngredienteRecetaInput[]
  ) => Promise<void>;
  productoAEditar?: Producto | null;
  materiasPrimas: MateriaPrima[];
  gastoFijoPorcion?: number;
}

const CATEGORIAS_PRODUCTO: CategoriaProducto[] = [
  'Pastas Rellenas',
  'Pastas Lisas',
  'Empanadas',
  'Tartas',
  'Salsas',
];

const UNIDADES_VENTA: UnidadVenta[] = ['Porcion', 'Docena', 'Kilo', 'Unidad'];

function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

interface IngredienteFormItem {
  materiaPrimaId: string;
  cantidad: number;
}

/**
 * Modal accesible para registrar o editar una receta con los 5 estados obligatorios.
 * Incluye selector dinámico de insumos y calculadora de costos y margen en vivo.
 */
export const ModalReceta: React.FC<ModalRecetaProps> = ({
  abierto,
  onCerrar,
  onGuardar,
  productoAEditar = null,
  materiasPrimas,
  gastoFijoPorcion = 0,
}) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto>('Pastas Rellenas');
  const [unidadVenta, setUnidadVenta] = useState<UnidadVenta>('Porcion');
  const [precioLista, setPrecioLista] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [ingredientes, setIngredientes] = useState<IngredienteFormItem[]>([]);

  // Estados temporales para la fila de agregar ingrediente
  const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState('');
  const [cantidadIngrediente, setCantidadIngrediente] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const primerInputRef = useRef<HTMLInputElement>(null);
  const esEdicion = Boolean(productoAEditar);

  // Inicialización de campos solo al abrir o cambiar de producto a editar
  useEffect(() => {
    if (abierto) {
      setErrorValidacion(null);
      setCantidadIngrediente('');

      if (productoAEditar) {
        setNombre(productoAEditar.nombre);
        setCategoria(productoAEditar.categoria);
        setUnidadVenta(productoAEditar.unidadVenta);
        setPrecioLista(productoAEditar.precioLista.toString());
        setStockMinimo(productoAEditar.stockMinimo.toString());
        setIngredientes(
          productoAEditar.ingredientes.map((i) => ({
            materiaPrimaId: i.materiaPrimaId,
            cantidad: i.cantidad,
          }))
        );
      } else {
        setNombre('');
        setCategoria('Pastas Rellenas');
        setUnidadVenta('Porcion');
        setPrecioLista('');
        setStockMinimo('5');
        setIngredientes([]);
      }

      setTimeout(() => primerInputRef.current?.focus(), 50);
    }
  }, [abierto, productoAEditar?.id]);

  // Manejo accesible de tecla Escape para cerrar modal
  useEffect(() => {
    if (!abierto) return;
    const manejarKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !guardando) {
        onCerrar();
      }
    };
    window.addEventListener('keydown', manejarKeyDown);
    return () => window.removeEventListener('keydown', manejarKeyDown);
  }, [abierto, guardando, onCerrar]);

  // Sincronizar insumo seleccionado por defecto cuando llegan las materias primas
  useEffect(() => {
    if (materiasPrimas.length > 0) {
      const existe = materiasPrimas.some((m) => m.id === materiaSeleccionadaId);
      if (!existe) {
        setMateriaSeleccionadaId(materiasPrimas[0].id);
      }
    } else {
      setMateriaSeleccionadaId('');
    }
  }, [materiasPrimas, materiaSeleccionadaId]);

  // Mapa rápido de materias primas por id para calcular costos
  const mapaMaterias = useMemo(() => {
    const mapa = new Map<string, MateriaPrima>();
    materiasPrimas.forEach((m) => mapa.set(m.id, m));
    return mapa;
  }, [materiasPrimas]);

  // Lista de ingredientes enriquecida para cálculo
  const ingredientesEnriquecidos: RecetaIngredienteItem[] = useMemo(() => {
    return ingredientes.map((item) => {
      const materia = mapaMaterias.get(item.materiaPrimaId);
      const original = productoAEditar?.ingredientes.find((i) => i.materiaPrimaId === item.materiaPrimaId);
      return {
        materiaPrimaId: item.materiaPrimaId,
        nombreMateriaPrima: materia?.nombre || original?.nombreMateriaPrima || 'Insumo',
        cantidad: item.cantidad,
        unidadMedida: materia?.unidadMedida || original?.unidadMedida || 'u',
        costoUnitario: materia?.costoUnitario ?? original?.costoUnitario ?? 0,
      };
    });
  }, [ingredientes, mapaMaterias, productoAEditar]);

  // Cálculo en vivo de costos y margen
  const costoTotal = useMemo(
    () => calcularCostoReceta(ingredientesEnriquecidos, gastoFijoPorcion),
    [ingredientesEnriquecidos, gastoFijoPorcion]
  );

  const precioNumero = parseFloat(precioLista) || 0;
  const { margenPesos, margenPorcentaje } = useMemo(
    () => calcularMargenGanancia(precioNumero, costoTotal),
    [precioNumero, costoTotal]
  );

  const estadoMargen = useMemo(
    () => clasificarMargen(margenPorcentaje, margenPesos, costoTotal, precioNumero),
    [margenPorcentaje, margenPesos, costoTotal, precioNumero]
  );

  const materiaSeleccionada = mapaMaterias.get(materiaSeleccionadaId);

  // Guía de texto y placeholder dinámico según la unidad de medida
  const placeholderCantidad = useMemo(() => {
    if (!materiaSeleccionada) return '0.00';
    switch (materiaSeleccionada.unidadMedida) {
      case 'kg':
        return 'ej. 0.3 (para 300 g)';
      case 'g':
        return 'ej. 250';
      case 'l':
        return 'ej. 0.25 (para 250 ml)';
      case 'ml':
        return 'ej. 200';
      case 'u':
        return 'ej. 2';
      default:
        return '0.00';
    }
  }, [materiaSeleccionada]);

  if (!abierto) return null;

  const handleAgregarIngrediente = () => {
    setErrorValidacion(null);
    if (!materiaSeleccionadaId) {
      setErrorValidacion('Seleccioná un ingrediente para agregar.');
      return;
    }

    const cant = parseFloat(cantidadIngrediente);
    if (isNaN(cant) || cant <= 0) {
      setErrorValidacion('La cantidad del ingrediente debe ser mayor a 0.');
      return;
    }

    // Si ya existe en la lista, actualizar cantidad
    const existenteIndex = ingredientes.findIndex(
      (i) => i.materiaPrimaId === materiaSeleccionadaId
    );

    if (existenteIndex >= 0) {
      const actualizados = [...ingredientes];
      actualizados[existenteIndex] = {
        materiaPrimaId: materiaSeleccionadaId,
        cantidad: Math.round((actualizados[existenteIndex].cantidad + cant) * 1000) / 1000,
      };
      setIngredientes(actualizados);
    } else {
      setIngredientes([...ingredientes, { materiaPrimaId: materiaSeleccionadaId, cantidad: cant }]);
    }

    setCantidadIngrediente('');
  };

  const handleQuitarIngrediente = (materiaPrimaId: string) => {
    setIngredientes(ingredientes.filter((i) => i.materiaPrimaId !== materiaPrimaId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setErrorValidacion('El nombre del producto es obligatorio.');
      primerInputRef.current?.focus();
      return;
    }

    const precio = parseFloat(precioLista);
    if (isNaN(precio) || precio < 0) {
      setErrorValidacion('El precio de venta debe ser un número mayor o igual a 0.');
      return;
    }

    const stockMin = parseFloat(stockMinimo);
    if (isNaN(stockMin) || stockMin < 0) {
      setErrorValidacion('El stock mínimo de freezer no puede ser negativo.');
      return;
    }

    if (ingredientes.length === 0) {
      setErrorValidacion('La receta debe tener al menos 1 ingrediente.');
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(
        {
          nombre: nombreLimpio,
          categoria,
          unidadVenta,
          precioLista: precio,
          stockMinimo: stockMin,
          stockActual: productoAEditar ? productoAEditar.stockActual : 0,
          activo: true,
        },
        ingredientes.map((i) => ({
          materiaPrimaId: i.materiaPrimaId,
          cantidad: i.cantidad,
        }))
      );
      onCerrar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar la receta.';
      setErrorValidacion(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-receta-titulo"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div>
            <h3 id="modal-receta-titulo" className="text-base font-bold text-stone-900">
              {esEdicion ? 'Editar Receta de Producto' : 'Nueva Receta y Costeo'}
            </h3>
            <p className="text-xs text-stone-500">
              Definí ingredientes por porción y calculá el margen de ganancia
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar modal"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 active:bg-stone-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50"
          >
            <span className="text-xl leading-none" aria-hidden="true">&times;</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorValidacion && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-marca-tomate/30 rounded-lg text-xs font-semibold text-marca-tomate"
            >
              {errorValidacion}
            </div>
          )}

          {/* Datos comerciales principales */}
          <div className="space-y-3">
            <div>
              <label htmlFor="nombre-producto" className="block text-xs font-bold text-stone-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                ref={primerInputRef}
                id="nombre-producto"
                type="text"
                required
                disabled={guardando}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder="ej. Raviolones de Osobuco, Tarta de Atún"
                className="w-full px-3 py-2 text-sm rounded-lg bg-white text-stone-900 border border-stone-300 placeholder-stone-400 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="categoria-producto" className="block text-xs font-bold text-stone-700 mb-1">
                  Categoría
                </label>
                <select
                  id="categoria-producto"
                  disabled={guardando}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaProducto)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white text-stone-900 border border-stone-300 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
                >
                  {CATEGORIAS_PRODUCTO.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="unidad-venta" className="block text-xs font-bold text-stone-700 mb-1">
                  Unidad de Venta
                </label>
                <select
                  id="unidad-venta"
                  disabled={guardando}
                  value={unidadVenta}
                  onChange={(e) => setUnidadVenta(e.target.value as UnidadVenta)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white text-stone-900 border border-stone-300 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
                >
                  {UNIDADES_VENTA.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="precio-lista" className="block text-xs font-bold text-stone-700 mb-1">
                  Precio de Venta ($) *
                </label>
                <input
                  id="precio-lista"
                  type="number"
                  step="any"
                  min="0"
                  required
                  disabled={guardando}
                  value={precioLista}
                  onChange={(e) => setPrecioLista(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="ej. 7500"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white text-stone-900 border border-stone-300 placeholder-stone-400 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="stock-minimo" className="block text-xs font-bold text-stone-700 mb-1">
                  Stock Mín. Freezer
                </label>
                <input
                  id="stock-minimo"
                  type="number"
                  step="any"
                  min="0"
                  disabled={guardando}
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="ej. 5"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white text-stone-900 border border-stone-300 placeholder-stone-400 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela focus-visible:border-marca-canela disabled:opacity-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Sección Dinámica: Composición de la Receta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Ingredientes de la Receta (para 1 {unidadVenta})
              </h4>
              <span className="text-xs text-stone-500">
                {ingredientes.length} {ingredientes.length === 1 ? 'insumo' : 'insumos'}
              </span>
            </div>

            {/* Fila para agregar ingrediente */}
            {materiasPrimas.length === 0 ? (
              <p className="text-xs text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                No hay materias primas disponibles. Primero debés registrar insumos en la solapa Materias Primas.
              </p>
            ) : (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="select-materia" className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                      Insumo
                    </label>
                    <select
                      id="select-materia"
                      disabled={guardando}
                      value={materiaSeleccionadaId}
                      onChange={(e) => setMateriaSeleccionadaId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white text-stone-900 border border-stone-300 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50"
                    >
                      {materiasPrimas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} ({m.unidadMedida}) - {formatearMoneda(m.costoUnitario)}/{m.unidadMedida}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cantidad-ingrediente" className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                      Cantidad en {materiaSeleccionada ? materiaSeleccionada.unidadMedida : ''}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="cantidad-ingrediente"
                        type="number"
                        step="any"
                        min="0.001"
                        disabled={guardando}
                        value={cantidadIngrediente}
                        onChange={(e) => setCantidadIngrediente(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarIngrediente();
                          }
                        }}
                        placeholder={placeholderCantidad}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white text-stone-900 border border-stone-300 placeholder-stone-400 transition-colors duration-150 hover:border-marca-canela active:border-marca-canela focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela disabled:opacity-50"
                      />
                      <Boton
                        type="button"
                        variante="primario"
                        tamano="chico"
                        disabled={guardando || !cantidadIngrediente || parseFloat(cantidadIngrediente) <= 0}
                        onClick={handleAgregarIngrediente}
                        aria-label="Agregar insumo a la receta"
                      >
                        + Agregar
                      </Boton>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de ingredientes agregados */}
            {ingredientesEnriquecidos.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-2">
                Sin ingredientes en la receta todavía.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden bg-white text-xs">
                {ingredientesEnriquecidos.map((item) => {
                  const subtotal = item.cantidad * item.costoUnitario;
                  return (
                    <li
                      key={item.materiaPrimaId}
                      className="p-2 flex items-center justify-between hover:bg-stone-50/80 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-stone-800">
                          {item.nombreMateriaPrima}
                        </span>
                        <span className="text-stone-500 ml-1.5">
                          {item.cantidad} {item.unidadMedida} &times; {formatearMoneda(item.costoUnitario)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">
                          {formatearMoneda(subtotal)}
                        </span>
                        <button
                          type="button"
                          disabled={guardando}
                          onClick={() => handleQuitarIngrediente(item.materiaPrimaId)}
                          aria-label={`Quitar ${item.nombreMateriaPrima}`}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-400 hover:text-marca-tomate hover:bg-stone-100 active:text-marca-tomate active:bg-stone-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-lg leading-none" aria-hidden="true">&times;</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
                {gastoFijoPorcion > 0 && (
                  <li className="p-2 flex items-center justify-between bg-amber-50/80 border-t border-amber-200 text-xs">
                    <span className="font-semibold text-amber-900">
                      💡 Gasto fijo por porción
                    </span>
                    <span className="font-bold text-amber-900">
                      +{formatearMoneda(gastoFijoPorcion)}
                    </span>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Calculadora en vivo de Costos y Márgenes */}
          <div className="p-3 bg-marca-beige/40 rounded-xl border border-marca-canela/20 space-y-2">
            <h4 className="text-xs font-bold text-marca-canela uppercase tracking-wider">
              Costeo en Vivo
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/80 p-2 rounded-lg border border-stone-200/60">
                <span className="block text-[11px] text-stone-500 font-medium">
                  {gastoFijoPorcion > 0 ? 'Costo Total' : 'Costo Insumos'}
                </span>
                <strong className="text-stone-800 text-sm font-bold">{formatearMoneda(costoTotal)}</strong>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-stone-200/60">
                <span className="block text-[11px] text-stone-500 font-medium">Precio Venta</span>
                <strong className="text-stone-800 text-sm font-bold">{formatearMoneda(precioNumero)}</strong>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-stone-200/60">
                <span className="block text-[11px] text-stone-500 font-medium">Margen ({margenPorcentaje}%)</span>
                <strong
                  className={`text-sm font-bold ${
                    estadoMargen === 'SALUDABLE'
                      ? 'text-emerald-700'
                      : estadoMargen === 'ADVERTENCIA'
                      ? 'text-marca-otono'
                      : estadoMargen === 'PERDIDA'
                      ? 'text-marca-tomate'
                      : estadoMargen === 'SIN_RECETA'
                      ? 'text-amber-700'
                      : 'text-stone-700'
                  }`}
                >
                  {formatearMoneda(margenPesos)}
                </strong>
              </div>
            </div>

            {estadoMargen === 'PERDIDA' && precioNumero > 0 && (
              <p className="text-[11px] font-semibold text-marca-tomate">
                ⚠️ Atención: El costo de los insumos supera el precio de venta.
              </p>
            )}

            {estadoMargen === 'SIN_RECETA' && precioNumero > 0 && (
              <p className="text-[11px] font-medium text-amber-700">
                ℹ️ Agregá los insumos de la receta para calcular el costo y margen real.
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-stone-200">
            <Boton
              type="button"
              variante="secundario"
              tamano="mediano"
              disabled={guardando}
              onClick={onCerrar}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              variante="primario"
              tamano="mediano"
              disabled={guardando}
              className="w-full sm:w-auto"
            >
              {guardando ? 'Guardando receta...' : esEdicion ? 'Guardar Cambios' : 'Crear Receta'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
