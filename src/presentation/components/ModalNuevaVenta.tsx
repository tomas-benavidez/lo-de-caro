import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Producto } from '../../domain/models/producto.ts';
import { Cliente } from '../../domain/models/cliente.ts';
import {
  NuevaVentaInput,
  EstadoCobranza,
  MetodoPago,
} from '../../domain/models/venta.ts';
import {
  calcularTotalVenta,
  verificarDisponibilidadStock,
} from '../../domain/services/ventaServicio.ts';
import { Boton } from './Boton.tsx';

export interface ItemVentaSeleccionado {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface ModalNuevaVentaProps {
  abierto: boolean;
  clientes: Cliente[];
  productos: Producto[];
  onCerrar: () => void;
  onGuardar: (venta: NuevaVentaInput) => Promise<void>;
  onAbrirNuevoCliente?: () => void;
}

export const ModalNuevaVenta: React.FC<ModalNuevaVentaProps> = ({
  abierto,
  clientes,
  productos,
  onCerrar,
  onGuardar,
  onAbrirNuevoCliente,
}) => {
  const [clienteId, setClienteId] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [estadoCobranza, setEstadoCobranza] = useState<EstadoCobranza>('Cobrado');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [items, setItems] = useState<ItemVentaSeleccionado[]>([]);

  // Estado para el selector de producto a agregar
  const [productoAAgregarId, setProductoAAgregarId] = useState<string>('');
  const [cantidadAAgregar, setCantidadAAgregar] = useState<string>('1');

  const [confirmarStockInsuficiente, setConfirmarStockInsuficiente] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const selectClienteRef = useRef<HTMLSelectElement>(null);

  // Inicialización de campos al abrir
  useEffect(() => {
    if (abierto) {
      setClienteId('');
      const hoy = new Date().toISOString().split('T')[0];
      setFecha(hoy);
      setEstadoCobranza('Cobrado');
      setMetodoPago('Efectivo');
      setItems([]);
      setConfirmarStockInsuficiente(false);
      setErrorValidacion(null);
      setCantidadAAgregar('1');

      if (productos.length > 0) {
        setProductoAAgregarId(productos[0].id);
      } else {
        setProductoAAgregarId('');
      }

      setTimeout(() => {
        selectClienteRef.current?.focus();
      }, 50);
    }
  }, [abierto, productos]);

  // Soporte de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto && !guardando) {
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, guardando, onCerrar]);

  // Mapa de productos por ID para acceso rápido
  const mapaProductos = useMemo(() => {
    return new Map<string, Producto>(productos.map((p) => [p.id, p]));
  }, [productos]);

  // Verificación de disponibilidad de stock en el freezer
  const disponibilidadStock = useMemo(() => {
    return verificarDisponibilidadStock(items, productos);
  }, [items, productos]);

  const hayStockInsuficiente = useMemo(() => {
    return disponibilidadStock.some((d) => !d.suficiente);
  }, [disponibilidadStock]);

  // Cálculo del monto total
  const totalVenta = useMemo(() => {
    return calcularTotalVenta(
      items.map((it) => ({ cantidad: it.cantidad, precioUnitario: it.precioUnitario })),
      estadoCobranza
    );
  }, [items, estadoCobranza]);

  const handleAgregarProducto = () => {
    if (!productoAAgregarId) return;
    const prod = mapaProductos.get(productoAAgregarId);
    if (!prod) return;

    const cant = parseFloat(cantidadAAgregar);
    if (isNaN(cant) || cant <= 0) {
      setErrorValidacion('La cantidad a agregar debe ser mayor a cero.');
      return;
    }

    setErrorValidacion(null);

    // Si ya existe el producto en la canasta, sumamos la cantidad
    setItems((prev) => {
      const existeIndex = prev.findIndex((it) => it.productoId === prod.id);
      if (existeIndex >= 0) {
        const copia = [...prev];
        copia[existeIndex] = {
          ...copia[existeIndex],
          cantidad: Math.round((copia[existeIndex].cantidad + cant) * 1000) / 1000,
        };
        return copia;
      }
      return [
        ...prev,
        {
          productoId: prod.id,
          cantidad: cant,
          precioUnitario: prod.precioLista,
        },
      ];
    });

    setCantidadAAgregar('1');
  };

  const handleModificarCantidad = (productoId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.productoId === productoId) {
            const nueva = Math.round((it.cantidad + delta) * 1000) / 1000;
            return nueva > 0 ? { ...it, cantidad: nueva } : null;
          }
          return it;
        })
        .filter((it): it is ItemVentaSeleccionado => it !== null)
    );
  };

  const handleModificarPrecio = (productoId: string, nuevoPrecioStr: string) => {
    const parsed = parseFloat(nuevoPrecioStr);
    const precio = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setItems((prev) =>
      prev.map((it) => (it.productoId === productoId ? { ...it, precioUnitario: precio } : it))
    );
  };

  const handleEliminarItem = (productoId: string) => {
    setItems((prev) => prev.filter((it) => it.productoId !== productoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setErrorValidacion('Agregá al menos un producto a la venta.');
      return;
    }

    if (estadoCobranza === 'Pendiente' && !clienteId) {
      setErrorValidacion(
        'Para registrar una venta "Pendiente de cobro", debés seleccionar un cliente registrado.'
      );
      return;
    }

    if (hayStockInsuficiente && !confirmarStockInsuficiente) {
      setErrorValidacion(
        'Hay productos con stock insuficiente en el freezer. Marcá la casilla de confirmación si deseás registrarla igual.'
      );
      return;
    }

    setGuardando(true);
    setErrorValidacion(null);
    try {
      await onGuardar({
        fecha,
        clienteId: clienteId || null,
        estadoPago: estadoCobranza,
        metodoPago,
        items,
      });
      onCerrar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar la venta.';
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

  const productoAAgregar = mapaProductos.get(productoAAgregarId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-venta"
    >
      <div className="relative w-full max-w-lg bg-marca-beige rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Cabecera */}
        <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 id="titulo-modal-venta" className="text-base font-bold text-marca-canela">
              Nueva Venta de Mostrador
            </h2>
            <p className="text-xs text-stone-500">Salida de congelados y cobro al cliente</p>
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

        {/* Contenido del formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorValidacion && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-marca-tomate/40 rounded-xl text-xs text-marca-tomate font-medium"
            >
              {errorValidacion}
            </div>
          )}

          {/* 1. Cliente y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="select-cliente" className="text-xs font-bold text-stone-700">
                  Cliente
                </label>
                {onAbrirNuevoCliente && (
                  <button
                    type="button"
                    onClick={onAbrirNuevoCliente}
                    disabled={guardando}
                    className="text-[11px] text-marca-canela font-semibold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca-canela rounded px-1"
                  >
                    + Nuevo cliente
                  </button>
                )}
              </div>
              <select
                id="select-cliente"
                ref={selectClienteRef}
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                disabled={guardando}
                className={estiloInput}
              >
                <option value="">Cliente Mostrador (Ocasional)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreApellido} {c.saldoPendiente > 0 ? `(Debe $${c.saldoPendiente})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="input-fecha-venta" className="block text-xs font-bold text-stone-700 mb-1">
                Fecha *
              </label>
              <input
                id="input-fecha-venta"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                disabled={guardando}
                className={estiloInput}
                required
              />
            </div>
          </div>

          {/* 2. Sección para agregar productos a la canasta */}
          <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-stone-800">Agregar Plato a la Venta</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div className="sm:col-span-2">
                <label htmlFor="select-producto-agregar" className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Plato del Freezer
                </label>
                <select
                  id="select-producto-agregar"
                  value={productoAAgregarId}
                  onChange={(e) => setProductoAAgregarId(e.target.value)}
                  disabled={guardando || productos.length === 0}
                  className={estiloInput}
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — Freezer: {p.stockActual} {p.unidadVenta} (${p.precioLista})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="input-cantidad-agregar" className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Cantidad
                </label>
                <div className="flex gap-1">
                  <input
                    id="input-cantidad-agregar"
                    type="number"
                    min="1"
                    step="any"
                    value={cantidadAAgregar}
                    onChange={(e) => setCantidadAAgregar(e.target.value)}
                    disabled={guardando}
                    className={estiloInput}
                  />
                  <Boton
                    type="button"
                    variante="primario"
                    tamano="chico"
                    onClick={handleAgregarProducto}
                    disabled={guardando || !productoAAgregarId}
                    className="shrink-0"
                  >
                    + Sumar
                  </Boton>
                </div>
              </div>
            </div>

            {productoAAgregar && (
              <p className="text-[11px] text-stone-500">
                Stock actual en freezer:{' '}
                <span
                  className={`font-semibold ${
                    productoAAgregar.stockActual <= 0
                      ? 'text-marca-tomate'
                      : productoAAgregar.stockActual <= productoAAgregar.stockMinimo
                      ? 'text-marca-otono'
                      : 'text-stone-700'
                  }`}
                >
                  {productoAAgregar.stockActual} {productoAAgregar.unidadVenta}
                </span>{' '}
                | Precio lista: ${productoAAgregar.precioLista.toLocaleString('es-AR')}
              </p>
            )}
          </div>

          {/* 3. Canasta de productos seleccionados */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-700">
                Productos en el Pedido ({items.length})
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-dashed border-stone-300 text-center text-xs text-stone-400">
                No hay productos en el pedido. Seleccioná un plato arriba y presioná "+ Sumar".
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => {
                  const prod = mapaProductos.get(it.productoId);
                  const subtotal = Math.round(it.cantidad * it.precioUnitario * 100) / 100;
                  const stockInfo = disponibilidadStock.find((d) => d.productoId === it.productoId);
                  const insuficiente = stockInfo && !stockInfo.suficiente;

                  return (
                    <div
                      key={it.productoId}
                      className={`p-3 bg-white rounded-xl border transition-all ${
                        insuficiente ? 'border-marca-otono/60 bg-amber-50/30' : 'border-stone-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {prod?.nombre || 'Producto'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                            <span className="text-stone-500">
                              Freezer: {prod?.stockActual ?? 0} {prod?.unidadVenta}
                            </span>
                            {insuficiente && (
                              <span className="text-marca-otono font-semibold bg-orange-100/70 px-1.5 py-0.2 rounded text-[10px]">
                                Falta stock ({stockInfo?.remanente} {prod?.unidadVenta})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón eliminar ítem */}
                        <button
                          type="button"
                          onClick={() => handleEliminarItem(it.productoId)}
                          disabled={guardando}
                          aria-label={`Quitar ${prod?.nombre} de la venta`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-marca-tomate active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-stone-500 font-medium">Cant:</span>
                          <button
                            type="button"
                            onClick={() => handleModificarCantidad(it.productoId, -1)}
                            disabled={guardando || it.cantidad <= 1}
                            className="w-7 h-7 flex items-center justify-center bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded text-xs font-bold text-stone-700 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca-canela"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-stone-800 px-1 min-w-[20px] text-center">
                            {it.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleModificarCantidad(it.productoId, 1)}
                            disabled={guardando}
                            className="w-7 h-7 flex items-center justify-center bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded text-xs font-bold text-stone-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca-canela"
                          >
                            +
                          </button>
                          <span className="text-[11px] text-stone-500">{prod?.unidadVenta}</span>
                        </div>

                        {/* Precio unitario cobrado */}
                        <div className="flex items-center gap-1.5">
                          <label
                            htmlFor={`input-precio-${it.productoId}`}
                            className="text-[11px] text-stone-500 font-medium"
                          >
                            Precio u:
                          </label>
                          <div className="relative w-24">
                            <span className="absolute left-2 top-2 text-[11px] text-stone-400">$</span>
                            <input
                              id={`input-precio-${it.productoId}`}
                              name={`precioUnitario_${it.productoId}`}
                              aria-label={`Precio unitario para ${prod?.nombre || 'producto'}`}
                              type="number"
                              min="0"
                              step="any"
                              value={it.precioUnitario}
                              onChange={(e) => handleModificarPrecio(it.productoId, e.target.value)}
                              disabled={guardando}
                              className="w-full bg-stone-50 border border-stone-200 rounded pl-5 pr-2 py-1 text-xs text-stone-800 text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca-canela"
                            />
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <span className="text-xs font-bold text-marca-canela">
                            ${subtotal.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Estado de Cobranza y Método de Pago */}
          <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Estado de Cobranza *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEstadoCobranza('Cobrado')}
                  disabled={guardando}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all min-h-[44px] flex items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                    estadoCobranza === 'Cobrado'
                      ? 'bg-marca-lima text-stone-900 border-[#9eb754] shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400 active:bg-stone-50'
                  }`}
                >
                  ✓ Cobrado
                </button>
                <button
                  type="button"
                  onClick={() => setEstadoCobranza('Pendiente')}
                  disabled={guardando}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all min-h-[44px] flex items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                    estadoCobranza === 'Pendiente'
                      ? 'bg-marca-otono text-white border-marca-otono shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400 active:bg-stone-50'
                  }`}
                >
                  ⏳ Pendiente
                </button>
                <button
                  type="button"
                  onClick={() => setEstadoCobranza('Regalo')}
                  disabled={guardando}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all min-h-[44px] flex items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                    estadoCobranza === 'Regalo'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400 active:bg-stone-50'
                  }`}
                >
                  🎁 Regalo
                </button>
              </div>
            </div>

            {/* Método de pago (solo si es Cobrado) */}
            {estadoCobranza === 'Cobrado' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
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
            )}
          </div>

          {/* Advertencia de stock insuficiente */}
          {hayStockInsuficiente && (
            <div className="p-3 bg-amber-50 border border-marca-otono/60 rounded-xl space-y-2 text-xs">
              <div className="flex items-start gap-2 text-marca-otono font-bold">
                <span>⚠️</span>
                <span>Stock insuficiente en freezer para uno o más productos.</span>
              </div>
              <p className="text-stone-600 text-[11px]">
                La venta continuará y el stock quedará en negativo o actualizado según la entrega real.
              </p>
              <label htmlFor="check-confirmar-stock-insuficiente" className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  id="check-confirmar-stock-insuficiente"
                  name="confirmarStockInsuficiente"
                  aria-label="Confirmar venta y descontar stock igualmente"
                  type="checkbox"
                  checked={confirmarStockInsuficiente}
                  onChange={(e) => setConfirmarStockInsuficiente(e.target.checked)}
                  disabled={guardando}
                  className="rounded text-marca-canela focus:ring-marca-canela min-h-[20px] min-w-[20px]"
                />
                <span className="font-semibold text-stone-800 text-[11px]">
                  Confirmar venta y descontar stock igualmente
                </span>
              </label>
            </div>
          )}

          {/* Resumen Total */}
          <div className="bg-stone-900 text-white p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-300">Total de la Venta</span>
              {estadoCobranza === 'Regalo' && (
                <span className="block text-[11px] text-purple-300 font-semibold">
                  (Regalo / Degustación)
                </span>
              )}
              {estadoCobranza === 'Pendiente' && (
                <span className="block text-[11px] text-amber-300 font-semibold">
                  (Pasa a Cuenta Corriente)
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-marca-beige">
                ${totalVenta.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
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
              disabled={guardando || items.length === 0}
            >
              {guardando ? 'Registrando...' : 'Confirmar Venta'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
