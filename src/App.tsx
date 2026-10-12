import React, { useState } from 'react';
import { MateriaPrima } from './domain/models/materiaPrima.ts';
import { Producto, AjusteStockProductoInput } from './domain/models/producto.ts';
import { LoteProduccion } from './domain/models/loteProduccion.ts';
import { Venta, NuevaVentaInput } from './domain/models/venta.ts';
import { Cliente, NuevoClienteInput, RegistroPagoClienteInput } from './domain/models/cliente.ts';
import { useMateriasPrimas } from './presentation/hooks/useMateriasPrimas.ts';
import { useProductosRecetas } from './presentation/hooks/useProductosRecetas.ts';
import { useProduccion } from './presentation/hooks/useProduccion.ts';
import { useVentasCobranzas } from './presentation/hooks/useVentasCobranzas.ts';
import { ListaMateriasPrimas } from './presentation/components/ListaMateriasPrimas.tsx';
import { ListaRecetas } from './presentation/components/ListaRecetas.tsx';
import { ListaProduccion } from './presentation/components/ListaProduccion.tsx';
import { ListaVentasCobranzas } from './presentation/components/ListaVentasCobranzas.tsx';
import { ListaGastos } from './presentation/components/ListaGastos.tsx';
import { ModalNuevaMateriaPrima } from './presentation/components/ModalNuevaMateriaPrima.tsx';
import { ModalReceta } from './presentation/components/ModalReceta.tsx';
import { ModalRegistroProduccion } from './presentation/components/ModalRegistroProduccion.tsx';
import { ModalAjusteStockProducto } from './presentation/components/ModalAjusteStockProducto.tsx';
import { ModalNuevaVenta } from './presentation/components/ModalNuevaVenta.tsx';
import { ModalNuevoCliente } from './presentation/components/ModalNuevoCliente.tsx';
import { ModalCobrarDeuda } from './presentation/components/ModalCobrarDeuda.tsx';
import { ModalNuevoGasto } from './presentation/components/ModalNuevoGasto.tsx';
import { ModalConfirmacion } from './presentation/components/ModalConfirmacion.tsx';
import { ModalEditarCliente } from './presentation/components/ModalEditarCliente.tsx';
import { ModalConfiguracionGastoFijo } from './presentation/components/ModalConfiguracionGastoFijo.tsx';
import { configuracionRepositorio } from './infrastructure/repositories/configuracionRepositorio.ts';
import { Gasto, NuevoGastoInput } from './domain/models/gasto.ts';
import { useGastos } from './presentation/hooks/useGastos.ts';


type PestanaActiva = 'materiasPrimas' | 'recetas' | 'produccion' | 'ventas' | 'gastos' | 'finanzas';

export const App: React.FC = () => {
  const [pestana, setPestana] = useState<PestanaActiva>('materiasPrimas');
  const [modalInsumoAbierto, setModalInsumoAbierto] = useState(false);
  const [materiaAEditar, setMateriaAEditar] = useState<MateriaPrima | null>(null);
  const [materiaAEliminar, setMateriaAEliminar] = useState<MateriaPrima | null>(null);
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null);

  // Estados para el módulo de Recetas y Costeo
  const [modalRecetaAbierto, setModalRecetaAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [confirmandoEliminacionReceta, setConfirmandoEliminacionReceta] = useState(false);
  const [errorEliminacionReceta, setErrorEliminacionReceta] = useState<string | null>(null);

  // Hook de ciclo de vida y datos para el módulo de materias primas
  const {
    materiasPrimas,
    cargando: cargandoMaterias,
    error: errorMaterias,
    recargar: recargarMaterias,
    crearMateriaPrima,
    actualizarMateriaPrima,
    eliminarMateriaPrima,
  } = useMateriasPrimas();

  // Hook de ciclo de vida y datos para el módulo de productos y recetas
  const {
    productos,
    cargando: cargandoRecetas,
    error: errorRecetas,
    recargar: recargarRecetas,
    crearProductoReceta,
    actualizarProductoReceta,
    ajustarStockProducto,
    eliminarProductoReceta,
  } = useProductosRecetas();

  // Estados para el módulo de Producción y Stock de Congelados
  const [modalProduccionAbierto, setModalProduccionAbierto] = useState(false);
  const [productoIdAProducir, setProductoIdAProducir] = useState<string | null>(null);
  const [loteAEliminar, setLoteAEliminar] = useState<LoteProduccion | null>(null);
  const [confirmandoEliminacionLote, setConfirmandoEliminacionLote] = useState(false);
  const [errorEliminacionLote, setErrorEliminacionLote] = useState<string | null>(null);

  // Estados para Ajuste Manual de Stock de Congelados (SPEC-003.1)
  const [modalAjusteStockAbierto, setModalAjusteStockAbierto] = useState(false);
  const [productoAAjustarStock, setProductoAAjustarStock] = useState<Producto | null>(null);


  // Hook de ciclo de vida y datos para el módulo de producción
  const {
    lotes,
    cargando: cargandoProduccion,
    error: errorProduccion,
    recargar: recargarProduccion,
    registrarProduccion,
    eliminarLote,
  } = useProduccion();

  // Estados para el módulo de Ventas y Cobranzas (SPEC-004)
  const [modalNuevaVentaAbierto, setModalNuevaVentaAbierto] = useState(false);
  const [modalNuevoClienteAbierto, setModalNuevoClienteAbierto] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null);
  const [confirmandoEliminacionCliente, setConfirmandoEliminacionCliente] = useState(false);
  const [errorEliminacionCliente, setErrorEliminacionCliente] = useState<string | null>(null);
  const [modalCobrarDeudaAbierto, setModalCobrarDeudaAbierto] = useState(false);
  const [clienteACobrar, setClienteACobrar] = useState<Cliente | null>(null);
  const [ventaAAnular, setVentaAAnular] = useState<Venta | null>(null);
  const [confirmandoAnulacionVenta, setConfirmandoAnulacionVenta] = useState(false);
  const [errorAnulacionVenta, setErrorAnulacionVenta] = useState<string | null>(null);

  // Hook de ciclo de vida y datos para el módulo de ventas y cobranzas
  const {
    ventas,
    clientes,
    resumen: resumenVentas,
    cargando: cargandoVentas,
    error: errorVentas,
    recargar: recargarVentas,
    registrarVenta,
    anularVenta,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    cobrarDeudaCliente,
  } = useVentasCobranzas();

  // Estados para configuración de Gasto Fijo por Porción
  const [gastoFijoPorcion, setGastoFijoPorcion] = useState<number>(() =>
    configuracionRepositorio.obtenerGastoFijoPorcion()
  );
  const [modalGastoFijoAbierto, setModalGastoFijoAbierto] = useState(false);

  // Estados para el módulo de Gastos y Egresos (SPEC-005)
  const [modalNuevoGastoAbierto, setModalNuevoGastoAbierto] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState<Gasto | null>(null);
  const [confirmandoEliminacionGasto, setConfirmandoEliminacionGasto] = useState(false);
  const [errorEliminacionGasto, setErrorEliminacionGasto] = useState<string | null>(null);

  // Hook de ciclo de vida y datos para el módulo de gastos
  const {
    gastos,
    resumen: resumenGastos,
    cargando: cargandoGastos,
    error: errorGastos,
    recargar: recargarGastos,
    registrarGasto,
    eliminarGasto,
  } = useGastos();

  const handleAbrirNuevoInsumo = () => {
    setMateriaAEditar(null);
    setModalInsumoAbierto(true);
  };

  const handleAbrirEditarInsumo = (materia: MateriaPrima) => {
    setMateriaAEditar(materia);
    setModalInsumoAbierto(true);
  };

  const handleCerrarModalInsumo = () => {
    setModalInsumoAbierto(false);
    setMateriaAEditar(null);
  };

  const handleGuardarInsumo = async (datos: Parameters<typeof crearMateriaPrima>[0]) => {
    if (materiaAEditar) {
      await actualizarMateriaPrima(materiaAEditar.id, datos);
    } else {
      await crearMateriaPrima(datos);
    }
  };

  const handleAbrirEliminarInsumo = (materia: MateriaPrima) => {
    setErrorEliminacion(null);
    setMateriaAEliminar(materia);
  };

  const handleConfirmarEliminacion = async () => {
    if (!materiaAEliminar) return;

    setConfirmandoEliminacion(true);
    setErrorEliminacion(null);
    try {
      await eliminarMateriaPrima(materiaAEliminar.id);
      setMateriaAEliminar(null);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar el insumo.';
      setErrorEliminacion(mensaje);
    } finally {
      setConfirmandoEliminacion(false);
    }
  };

  const handleCancelarEliminacion = () => {
    if (confirmandoEliminacion) return;
    setMateriaAEliminar(null);
    setErrorEliminacion(null);
  };

  // Handlers para el módulo de Recetas y Costeo
  const handleAbrirNuevaReceta = () => {
    setProductoAEditar(null);
    setModalRecetaAbierto(true);
  };

  const handleAbrirEditarReceta = (producto: Producto) => {
    setProductoAEditar(producto);
    setModalRecetaAbierto(true);
  };

  const handleCerrarModalReceta = () => {
    setModalRecetaAbierto(false);
    setProductoAEditar(null);
  };

  const handleGuardarReceta = async (
    producto: Parameters<typeof crearProductoReceta>[0],
    ingredientes: Parameters<typeof crearProductoReceta>[1]
  ) => {
    if (productoAEditar) {
      await actualizarProductoReceta(productoAEditar.id, producto, ingredientes);
    } else {
      await crearProductoReceta(producto, ingredientes);
    }
  };

  const handleAbrirEliminarReceta = (producto: Producto) => {
    setErrorEliminacionReceta(null);
    setProductoAEliminar(producto);
  };

  const handleConfirmarEliminacionReceta = async () => {
    if (!productoAEliminar) return;

    setConfirmandoEliminacionReceta(true);
    setErrorEliminacionReceta(null);
    try {
      await eliminarProductoReceta(productoAEliminar.id);
      setProductoAEliminar(null);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar la receta.';
      setErrorEliminacionReceta(mensaje);
    } finally {
      setConfirmandoEliminacionReceta(false);
    }
  };

  const handleCancelarEliminacionReceta = () => {
    if (confirmandoEliminacionReceta) return;
    setProductoAEliminar(null);
    setErrorEliminacionReceta(null);
  };

  // Handlers para el módulo de Producción y Stock de Congelados
  const handleAbrirNuevaProduccion = (productoId?: string) => {
    setProductoIdAProducir(productoId || null);
    setModalProduccionAbierto(true);
  };

  const handleCerrarModalProduccion = () => {
    setModalProduccionAbierto(false);
    setProductoIdAProducir(null);
  };

  const handleGuardarProduccion = async (
    lote: Parameters<typeof registrarProduccion>[0],
    ingredientes: Parameters<typeof registrarProduccion>[1]
  ) => {
    await registrarProduccion(lote, ingredientes);
    // Recargar materias primas y recetas para mantener sincronizado el stock en toda la app
    await Promise.all([recargarMaterias(), recargarRecetas()]);
  };

  const handleAbrirEliminarLote = (lote: LoteProduccion) => {
    setErrorEliminacionLote(null);
    setLoteAEliminar(lote);
  };

  const handleConfirmarEliminacionLote = async () => {
    if (!loteAEliminar) return;

    setConfirmandoEliminacionLote(true);
    setErrorEliminacionLote(null);
    try {
      await eliminarLote(loteAEliminar.id);
      setLoteAEliminar(null);
      await Promise.all([recargarMaterias(), recargarRecetas()]);
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al eliminar el lote de producción.';
      setErrorEliminacionLote(mensaje);
    } finally {
      setConfirmandoEliminacionLote(false);
    }
  };

  const handleCancelarEliminacionLote = () => {
    if (confirmandoEliminacionLote) return;
    setLoteAEliminar(null);
    setErrorEliminacionLote(null);
  };

  // Handlers para Ajuste Manual de Stock de Congelados (SPEC-003.1)
  const handleAbrirAjusteStock = (producto: Producto) => {
    setProductoAAjustarStock(producto);
    setModalAjusteStockAbierto(true);
  };

  const handleCerrarAjusteStock = () => {
    setModalAjusteStockAbierto(false);
    setProductoAAjustarStock(null);
  };

  const handleGuardarAjusteStock = async (input: AjusteStockProductoInput) => {
    if (!productoAAjustarStock) return;
    await ajustarStockProducto(productoAAjustarStock.id, input);
  };

  // Handlers para el módulo de Ventas y Cobranzas (SPEC-004)
  const handleAbrirNuevaVenta = () => {
    setModalNuevaVentaAbierto(true);
  };

  const handleCerrarNuevaVenta = () => {
    setModalNuevaVentaAbierto(false);
  };

  const handleGuardarVenta = async (datos: NuevaVentaInput) => {
    await registrarVenta(datos, productos);
    await recargarRecetas();
  };

  const handleAbrirNuevoCliente = () => {
    setModalNuevoClienteAbierto(true);
  };

  const handleCerrarNuevoCliente = () => {
    setModalNuevoClienteAbierto(false);
  };

  const handleGuardarCliente = async (datos: NuevoClienteInput) => {
    return await crearCliente(datos);
  };

  const handleAbrirEditarCliente = (cliente: Cliente) => {
    setClienteAEditar(cliente);
  };

  const handleCerrarEditarCliente = () => {
    setClienteAEditar(null);
  };

  const handleGuardarEditarCliente = async (id: string, datos: NuevoClienteInput) => {
    return await actualizarCliente(id, datos);
  };

  const handleAbrirEliminarCliente = (cliente: Cliente) => {
    setErrorEliminacionCliente(null);
    setClienteAEliminar(cliente);
  };

  const handleCancelarEliminacionCliente = () => {
    if (confirmandoEliminacionCliente) return;
    setClienteAEliminar(null);
    setErrorEliminacionCliente(null);
  };

  const handleConfirmarEliminacionCliente = async () => {
    if (!clienteAEliminar) return;
    setConfirmandoEliminacionCliente(true);
    setErrorEliminacionCliente(null);
    try {
      await eliminarCliente(clienteAEliminar.id);
      setClienteAEliminar(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar cliente.';
      setErrorEliminacionCliente(msg);
    } finally {
      setConfirmandoEliminacionCliente(false);
    }
  };

  const handleAbrirConfigurarGastoFijo = () => {
    setModalGastoFijoAbierto(true);
  };

  const handleCerrarConfigurarGastoFijo = () => {
    setModalGastoFijoAbierto(false);
  };

  const handleGuardarConfigurarGastoFijo = (nuevoMonto: number) => {
    configuracionRepositorio.guardarGastoFijoPorcion(nuevoMonto);
    setGastoFijoPorcion(nuevoMonto);
  };

  const handleAbrirCobrarDeuda = (cliente: Cliente) => {
    setClienteACobrar(cliente);
    setModalCobrarDeudaAbierto(true);
  };

  const handleCerrarCobrarDeuda = () => {
    setModalCobrarDeudaAbierto(false);
    setClienteACobrar(null);
  };

  const handleGuardarCobroDeuda = async (datos: RegistroPagoClienteInput) => {
    await cobrarDeudaCliente(datos);
  };

  const handleAbrirAnularVenta = (venta: Venta) => {
    setErrorAnulacionVenta(null);
    setVentaAAnular(venta);
  };

  const handleCancelarAnulacionVenta = () => {
    if (confirmandoAnulacionVenta) return;
    setVentaAAnular(null);
    setErrorAnulacionVenta(null);
  };

  const handleConfirmarAnulacionVenta = async () => {
    if (!ventaAAnular) return;
    setConfirmandoAnulacionVenta(true);
    setErrorAnulacionVenta(null);
    try {
      await anularVenta(ventaAAnular.id);
      setVentaAAnular(null);
      await recargarRecetas();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al anular la venta.';
      setErrorAnulacionVenta(mensaje);
    } finally {
      setConfirmandoAnulacionVenta(false);
    }
  };

  const handleAbrirNuevoGasto = () => {
    setModalNuevoGastoAbierto(true);
  };

  const handleCerrarModalNuevoGasto = () => {
    setModalNuevoGastoAbierto(false);
  };

  const handleGuardarGasto = async (
    datos: NuevoGastoInput,
    materiaPrimaSeleccionada?: MateriaPrima
  ) => {
    await registrarGasto(datos, materiaPrimaSeleccionada);
    if (datos.compraMateriaPrima) {
      await recargarMaterias();
      await recargarRecetas();
    }
  };

  const handleAbrirEliminarGasto = (gasto: Gasto) => {
    setErrorEliminacionGasto(null);
    setGastoAEliminar(gasto);
  };

  const handleConfirmarEliminacionGasto = async () => {
    if (!gastoAEliminar) return;
    setConfirmandoEliminacionGasto(true);
    setErrorEliminacionGasto(null);
    try {
      const mpRelacionada = gastoAEliminar.compraMateriaPrima
        ? materiasPrimas.find((m) => m.id === gastoAEliminar.compraMateriaPrima?.materiaPrimaId)
        : undefined;
      await eliminarGasto(gastoAEliminar.id, mpRelacionada);
      if (gastoAEliminar.compraMateriaPrima) {
        await recargarMaterias();
        await recargarRecetas();
      }
      setGastoAEliminar(null);
    } catch (err) {
      setErrorEliminacionGasto(
        err instanceof Error ? err.message : 'Error al anular el gasto.'
      );
    } finally {
      setConfirmandoEliminacionGasto(false);
    }
  };

  const handleCancelarEliminacionGasto = () => {
    if (confirmandoEliminacionGasto) return;
    setGastoAEliminar(null);
    setErrorEliminacionGasto(null);
  };

  return (

    <div className="min-h-screen flex flex-col bg-marca-beige text-stone-800">
      {/* Encabezado Superior Mobile-First */}
      <header className="bg-white/80 backdrop-blur border-b border-stone-200/80 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/logos/png rojo.svg"
              alt="Logo Lo de Caro"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                // Fallback si el SVG no carga
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-lg font-bold text-marca-canela leading-tight tracking-tight">
                Lo de Caro
              </h1>
              <p className="text-xs text-stone-500 font-medium">Comida casera congelada</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-marca-canela/80 border border-marca-canela/30 rounded px-2 py-0.5">
            MVP v0.1
          </span>
        </div>
      </header>

      {/* Navegación por Solapas (Sin pills saturadas, limpio y accesible) */}
      <nav className="bg-white border-b border-stone-200 sticky top-[57px] z-20 px-2 overflow-x-auto scrollbar-none">
        <div className="max-w-2xl mx-auto flex space-x-1 py-1.5">
          {[
            { id: 'materiasPrimas', label: 'Materias Primas' },
            { id: 'recetas', label: 'Recetas' },
            { id: 'produccion', label: 'Producción' },
            { id: 'ventas', label: 'Ventas' },
            { id: 'gastos', label: 'Gastos' },
            { id: 'finanzas', label: 'Finanzas' },
          ].map((item) => {
            const activa = pestana === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPestana(item.id as PestanaActiva)}
                className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-canela ${
                  activa
                    ? 'bg-marca-canela text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Área de Contenido Principal */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4">
        {pestana === 'materiasPrimas' && (
          <ListaMateriasPrimas
            materiasPrimas={materiasPrimas}
            gastos={gastos}
            cargando={cargandoMaterias}
            error={errorMaterias}
            onAbrirNuevoModal={handleAbrirNuevoInsumo}
            onEditar={handleAbrirEditarInsumo}
            onEliminar={handleAbrirEliminarInsumo}
            onReintentar={recargarMaterias}
          />
        )}

        {pestana === 'recetas' && (
          <ListaRecetas
            productos={productos}
            cargando={cargandoRecetas}
            error={errorRecetas}
            gastoFijoPorcion={gastoFijoPorcion}
            onConfigurarGastoFijo={handleAbrirConfigurarGastoFijo}
            onAbrirNuevoModal={handleAbrirNuevaReceta}
            onEditar={handleAbrirEditarReceta}
            onEliminar={handleAbrirEliminarReceta}
            onReintentar={recargarRecetas}
          />
        )}

        {pestana === 'produccion' && (
          <ListaProduccion
            lotes={lotes}
            productos={productos}
            cargando={cargandoProduccion}
            error={errorProduccion}
            onAbrirNuevoModal={() => handleAbrirNuevaProduccion()}
            onCocinarProducto={(prodId) => handleAbrirNuevaProduccion(prodId)}
            onAjustarStock={handleAbrirAjusteStock}
            onEliminarLote={handleAbrirEliminarLote}
            onReintentar={() => {
              recargarProduccion();
              recargarMaterias();
              recargarRecetas();
            }}
          />
        )}

        {pestana === 'ventas' && (
          <ListaVentasCobranzas
            ventas={ventas}
            clientes={clientes}
            resumen={resumenVentas}
            cargando={cargandoVentas}
            error={errorVentas}
            onAbrirNuevaVenta={handleAbrirNuevaVenta}
            onAbrirNuevoCliente={handleAbrirNuevoCliente}
            onCobrarDeuda={handleAbrirCobrarDeuda}
            onEditarCliente={handleAbrirEditarCliente}
            onEliminarCliente={handleAbrirEliminarCliente}
            onAnularVenta={handleAbrirAnularVenta}
            onReintentar={() => {
              recargarVentas();
              recargarRecetas();
            }}
          />
        )}

        {pestana === 'gastos' && (
          <ListaGastos
            gastos={gastos}
            resumen={resumenGastos}
            cargando={cargandoGastos}
            error={errorGastos}
            onAbrirNuevoGasto={handleAbrirNuevoGasto}
            onEliminarGasto={handleAbrirEliminarGasto}
            onReintentar={recargarGastos}
          />
        )}

        {pestana === 'finanzas' && (() => {
          const totalCobrado = resumenVentas.totalCobrado;
          const totalGastos = resumenGastos.totalGastos;
          const gananciaNeta = totalCobrado - totalGastos;
          const margenPorcentaje =
            totalCobrado > 0
              ? Math.round(((gananciaNeta / totalCobrado) * 100) * 10) / 10
              : 0;
          const metaRetiro = 300000;
          const porcentajeMeta = Math.min(
            100,
            Math.max(0, Math.round((gananciaNeta / metaRetiro) * 100))
          );

          return (
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">Balance y Meta Mensual</h2>
                <p className="text-xs text-stone-500">
                  Cruce real de ventas cobradas vs. gastos totales y calculadora de meta ($300.000)
                </p>
              </div>

              {/* Tarjetas de Resumen Financiero Real */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <span className="text-[11px] font-semibold text-stone-500 block truncate">
                    Ingresos Cobrados
                  </span>
                  <span className="text-base sm:text-lg font-bold text-emerald-700 block mt-0.5">
                    ${totalCobrado.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] text-stone-400">Total ventas cobradas</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <span className="text-[11px] font-semibold text-stone-500 block truncate">
                    Gastos Totales
                  </span>
                  <span className="text-base sm:text-lg font-bold text-marca-tomate block mt-0.5">
                    ${totalGastos.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] text-stone-400">Egresos registrados</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <span className="text-[11px] font-semibold text-stone-500 block truncate">
                    Ganancia Neta Real
                  </span>
                  <span
                    className={`text-base sm:text-lg font-bold block mt-0.5 ${
                      gananciaNeta >= 0 ? 'text-[#446b1d]' : 'text-marca-tomate'
                    }`}
                  >
                    ${gananciaNeta.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] text-stone-400">Ventas - Gastos</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <span className="text-[11px] font-semibold text-stone-500 block truncate">
                    Margen Global
                  </span>
                  <span
                    className={`text-base sm:text-lg font-bold block mt-0.5 ${
                      margenPorcentaje >= 30
                        ? 'text-[#446b1d]'
                        : margenPorcentaje > 0
                        ? 'text-amber-700'
                        : 'text-marca-tomate'
                    }`}
                  >
                    {margenPorcentaje}%
                  </span>
                  <span className="text-[10px] text-stone-400">Sobre ingresos</span>
                </div>
              </div>

              {/* Termómetro de Meta de Retiro Mensual ($300.000) */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">
                      Meta de Retiro Personal de Caro
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Sueldo mensual objetivo configurado en el Excel
                    </span>
                  </div>
                  <span className="text-sm font-bold text-marca-canela">
                    ${metaRetiro.toLocaleString('es-AR')} / mes
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200">
                  <div
                    className="bg-marca-canela h-3 rounded-full transition-all duration-300"
                    style={{ width: `${porcentajeMeta}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-stone-600">
                  <span>Progreso: <strong>{porcentajeMeta}%</strong> alcanzado</span>
                  <span>
                    Faltan: <strong>${Math.max(0, metaRetiro - gananciaNeta).toLocaleString('es-AR')}</strong>
                  </span>
                </div>
              </div>
            </section>
          );
        })()}
      </main>

      {/* Modal accesible de nueva / edición de materia prima */}
      <ModalNuevaMateriaPrima
        abierto={modalInsumoAbierto}
        materiaPrimaAEditar={materiaAEditar}
        onCerrar={handleCerrarModalInsumo}
        onGuardar={handleGuardarInsumo}
      />

      {/* Modal accesible de confirmación de eliminación */}
      <ModalConfirmacion
        abierto={Boolean(materiaAEliminar)}
        titulo="Eliminar Materia Prima"
        mensaje={
          materiaAEliminar
            ? `¿Estás segura de que deseás eliminar "${materiaAEliminar.nombre}"? Esta acción borrará el insumo del listado.`
            : ''
        }
        textoConfirmar="Eliminar definitivamente"
        textoCancelar="Cancelar"
        confirmando={confirmandoEliminacion}
        error={errorEliminacion}
        onConfirmar={handleConfirmarEliminacion}
        onCancelar={handleCancelarEliminacion}
      />

      {/* Modal accesible de nueva / edición de receta y costeo */}
      <ModalReceta
        abierto={modalRecetaAbierto}
        productoAEditar={productoAEditar}
        materiasPrimas={materiasPrimas}
        gastoFijoPorcion={gastoFijoPorcion}
        onCerrar={handleCerrarModalReceta}
        onGuardar={handleGuardarReceta}
      />

      {/* Modal accesible de confirmación de eliminación de receta */}
      <ModalConfirmacion
        abierto={Boolean(productoAEliminar)}
        titulo="Eliminar Receta de Producto"
        mensaje={
          productoAEliminar
            ? `¿Estás segura de que deseás eliminar la receta "${productoAEliminar.nombre}"? Esta acción borrará el producto y sus relaciones de ingredientes.`
            : ''
        }
        textoConfirmar="Eliminar definitivamente"
        textoCancelar="Cancelar"
        confirmando={confirmandoEliminacionReceta}
        error={errorEliminacionReceta}
        onConfirmar={handleConfirmarEliminacionReceta}
        onCancelar={handleCancelarEliminacionReceta}
      />

      {/* Modal accesible de registro de lote de producción */}
      <ModalRegistroProduccion
        abierto={modalProduccionAbierto}
        productoIdInicial={productoIdAProducir}
        productos={productos}
        materiasPrimas={materiasPrimas}
        onCerrar={handleCerrarModalProduccion}
        onGuardar={handleGuardarProduccion}
      />

      {/* Modal accesible de ajuste manual de stock de freezer (SPEC-003.1) */}
      <ModalAjusteStockProducto
        abierto={modalAjusteStockAbierto}
        producto={productoAAjustarStock}
        onCerrar={handleCerrarAjusteStock}
        onGuardar={handleGuardarAjusteStock}
      />

      {/* Modal accesible de confirmación de anulación de lote de producción */}

      <ModalConfirmacion
        abierto={Boolean(loteAEliminar)}
        titulo="Anular Lote de Producción"
        mensaje={
          loteAEliminar
            ? `¿Estás segura de que deseás anular el lote de "${loteAEliminar.nombreProducto}" (${loteAEliminar.cantidadElaborada} ${loteAEliminar.unidadVenta}) del ${loteAEliminar.fecha}? Esta acción descontará las unidades elaboradas del freezer y restituirá los insumos consumidos al stock de materias primas.`
            : ''
        }
        textoConfirmar="Anular lote y restituir stock"
        textoCancelar="Cancelar"
        confirmando={confirmandoEliminacionLote}
        error={errorEliminacionLote}
        onConfirmar={handleConfirmarEliminacionLote}
        onCancelar={handleCancelarEliminacionLote}
      />

      {/* Modal accesible de nueva venta de mostrador (SPEC-004) */}
      <ModalNuevaVenta
        abierto={modalNuevaVentaAbierto}
        clientes={clientes}
        productos={productos}
        onCerrar={handleCerrarNuevaVenta}
        onGuardar={handleGuardarVenta}
        onAbrirNuevoCliente={handleAbrirNuevoCliente}
      />

      {/* Modal accesible de nuevo cliente (SPEC-004) */}
      <ModalNuevoCliente
        abierto={modalNuevoClienteAbierto}
        onCerrar={handleCerrarNuevoCliente}
        onGuardar={handleGuardarCliente}
      />

      {/* Modal accesible de edición de cliente */}
      <ModalEditarCliente
        abierto={Boolean(clienteAEditar)}
        cliente={clienteAEditar}
        onCerrar={handleCerrarEditarCliente}
        onGuardar={handleGuardarEditarCliente}
      />

      {/* Modal accesible de confirmación de eliminación de cliente */}
      <ModalConfirmacion
        abierto={Boolean(clienteAEliminar)}
        titulo="Eliminar Cliente"
        mensaje={
          clienteAEliminar
            ? clienteAEliminar.saldoPendiente > 0
              ? `¿Estás segura de que deseás eliminar a "${clienteAEliminar.nombreApellido}"? ADVERTENCIA: El cliente registra una deuda pendiente de $${clienteAEliminar.saldoPendiente.toLocaleString('es-AR')}. Si lo eliminás, no podrás registrar cobranzas sobre su cuenta.`
              : `¿Estás segura de que deseás eliminar a "${clienteAEliminar.nombreApellido}"? Sus ventas anteriores quedarán registradas en el historial pero ya no figurará en la agenda de clientes.`
            : ''
        }
        textoConfirmar="Eliminar cliente"
        textoCancelar="Cancelar"
        confirmando={confirmandoEliminacionCliente}
        error={errorEliminacionCliente}
        onConfirmar={handleConfirmarEliminacionCliente}
        onCancelar={handleCancelarEliminacionCliente}
      />

      {/* Modal accesible de configuración de gasto fijo por porción */}
      <ModalConfiguracionGastoFijo
        abierto={modalGastoFijoAbierto}
        valorActual={gastoFijoPorcion}
        onCerrar={handleCerrarConfigurarGastoFijo}
        onGuardar={handleGuardarConfigurarGastoFijo}
      />

      {/* Modal accesible para cobrar deuda de cliente (SPEC-004) */}
      <ModalCobrarDeuda
        abierto={modalCobrarDeudaAbierto}
        cliente={clienteACobrar}
        onCerrar={handleCerrarCobrarDeuda}
        onGuardar={handleGuardarCobroDeuda}
      />

      {/* Modal accesible de confirmación de anulación de venta (SPEC-004) */}
      <ModalConfirmacion
        abierto={Boolean(ventaAAnular)}
        titulo="Anular Venta"
        mensaje={
          ventaAAnular
            ? `¿Estás segura de que deseás anular la venta de "${ventaAAnular.nombreCliente}" por $${ventaAAnular.total.toLocaleString('es-AR')} del ${ventaAAnular.fecha}? Esta acción restituirá los productos al freezer y ajustará el saldo adeudado si la venta estaba pendiente.`
            : ''
        }
        textoConfirmar="Anular venta y restituir freezer"
        textoCancelar="Cancelar"
        confirmando={confirmandoAnulacionVenta}
        error={errorAnulacionVenta}
        onConfirmar={handleConfirmarAnulacionVenta}
        onCancelar={handleCancelarAnulacionVenta}
      />

      {/* Modal accesible de nuevo gasto o compra (SPEC-005) */}
      <ModalNuevoGasto
        abierto={modalNuevoGastoAbierto}
        materiasPrimas={materiasPrimas}
        onCerrar={handleCerrarModalNuevoGasto}
        onGuardar={handleGuardarGasto}
      />

      {/* Modal accesible de confirmación de anulación de gasto (SPEC-005) */}
      <ModalConfirmacion
        abierto={Boolean(gastoAEliminar)}
        titulo="Anular Gasto o Egreso"
        mensaje={
          gastoAEliminar
            ? `¿Estás segura de que deseás anular el gasto "${gastoAEliminar.concepto}" por $${gastoAEliminar.monto.toLocaleString('es-AR')} del ${gastoAEliminar.fecha}? ${
                gastoAEliminar.compraMateriaPrima
                  ? `Esta acción además descontará las ${gastoAEliminar.compraMateriaPrima.cantidadComprada} ${gastoAEliminar.compraMateriaPrima.unidadMedida} sumadas al stock de "${gastoAEliminar.compraMateriaPrima.nombreMateriaPrima}".`
                  : 'Esta acción borrará el registro del libro diario.'
              }`
            : ''
        }
        textoConfirmar="Anular gasto"
        textoCancelar="Cancelar"
        confirmando={confirmandoEliminacionGasto}
        error={errorEliminacionGasto}
        onConfirmar={handleConfirmarEliminacionGasto}
        onCancelar={handleCancelarEliminacionGasto}
      />

      {/* Pie de página con identidad sutil */}
      <footer className="text-center py-4 text-xs text-stone-400">
        Lo de Caro &copy; 2026 — Sistema de Gestión Gastronómica
      </footer>
    </div>
  );
};

export default App;
