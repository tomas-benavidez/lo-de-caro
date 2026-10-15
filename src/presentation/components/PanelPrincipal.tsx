import React, { useState } from 'react';
import { Usuario } from '../../domain/models/auth.ts';
import { MateriaPrima } from '../../domain/models/materiaPrima.ts';
import { Producto, AjusteStockProductoInput } from '../../domain/models/producto.ts';
import { LoteProduccion } from '../../domain/models/loteProduccion.ts';
import { Venta, NuevaVentaInput } from '../../domain/models/venta.ts';
import { Cliente, NuevoClienteInput, RegistroPagoClienteInput } from '../../domain/models/cliente.ts';
import { useMateriasPrimas } from '../hooks/useMateriasPrimas.ts';
import { useProductosRecetas } from '../hooks/useProductosRecetas.ts';
import { useProduccion } from '../hooks/useProduccion.ts';
import { useVentasCobranzas } from '../hooks/useVentasCobranzas.ts';
import { ListaMateriasPrimas } from './ListaMateriasPrimas.tsx';
import { ListaRecetas } from './ListaRecetas.tsx';
import { ListaProduccion } from './ListaProduccion.tsx';
import { ListaVentasCobranzas } from './ListaVentasCobranzas.tsx';
import { ListaGastos } from './ListaGastos.tsx';
import { TableroFinanzas } from './TableroFinanzas.tsx';
import { ModalNuevaMateriaPrima } from './ModalNuevaMateriaPrima.tsx';
import { ModalReceta } from './ModalReceta.tsx';
import { ModalRegistroProduccion } from './ModalRegistroProduccion.tsx';
import { ModalAjusteStockProducto } from './ModalAjusteStockProducto.tsx';
import { ModalNuevaVenta } from './ModalNuevaVenta.tsx';
import { ModalNuevoCliente } from './ModalNuevoCliente.tsx';
import { ModalCobrarDeuda } from './ModalCobrarDeuda.tsx';
import { ModalNuevoGasto } from './ModalNuevoGasto.tsx';
import { ModalConfirmacion } from './ModalConfirmacion.tsx';
import { ModalEditarCliente } from './ModalEditarCliente.tsx';
import { ModalConfiguracionGastoFijo } from './ModalConfiguracionGastoFijo.tsx';
import { configuracionRepositorio } from '../../infrastructure/repositories/configuracionRepositorio.ts';
import { Gasto, NuevoGastoInput } from '../../domain/models/gasto.ts';
import { useGastos } from '../hooks/useGastos.ts';

export type PestanaActiva = 'materiasPrimas' | 'recetas' | 'produccion' | 'ventas' | 'gastos' | 'finanzas';

export interface PanelPrincipalProps {
  usuario: Usuario;
  onCerrarSesion: () => Promise<void>;
}

interface ModuloNavegacion {
  id: PestanaActiva;
  labelDesktop: string;
  labelMobile: string;
  icono: (activo: boolean) => React.ReactNode;
}

const MODULOS: ModuloNavegacion[] = [
  {
    id: 'materiasPrimas',
    labelDesktop: 'Materias Primas',
    labelMobile: 'Insumos',
    icono: (activo) => (
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={activo ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    id: 'recetas',
    labelDesktop: 'Recetas',
    labelMobile: 'Recetas',
    icono: (activo) => (
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={activo ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    id: 'produccion',
    labelDesktop: 'Producción',
    labelMobile: 'Cocina',
    icono: (activo) => (
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={activo ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 010 11.314z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
        />
      </svg>
    ),
  },
  {
    id: 'ventas',
    labelDesktop: 'Ventas',
    labelMobile: 'Ventas',
    icono: (activo) => (
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={activo ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
  },
  {
    id: 'gastos',
    labelDesktop: 'Gastos',
    labelMobile: 'Gastos',
    icono: (activo) => (
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={activo ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
        />
      </svg>
    ),
  },
  {
    id: 'finanzas',
    labelDesktop: 'Finanzas',
    labelMobile: 'Finanzas',
    icono: (activo) => (
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={activo ? 2.2 : 1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

const obtenerFondosPestana = (p: PestanaActiva) => {
  switch (p) {
    case 'materiasPrimas':
    case 'recetas':
      return {
        mobile: '/backgrounds/back_mobile_1.png',
        desktop: '/backgrounds/back_desktop_1.png',
      };
    case 'produccion':
    case 'ventas':
      return {
        mobile: '/backgrounds/back_mobile_2.png',
        desktop: '/backgrounds/back_desktop_2.png',
      };
    case 'gastos':
    case 'finanzas':
      return {
        mobile: '/backgrounds/back_mobile_3.png',
        desktop: '/backgrounds/back_desktop_3.png',
      };
  }
};

/**
 * Panel Principal de Gestión para "Lo de Caro".
 * Solo se monta en el árbol de React cuando existe una sesión autenticada.
 */
export const PanelPrincipal: React.FC<PanelPrincipalProps> = ({
  usuario,
  onCerrarSesion,
}) => {
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
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

  const handleCerrarSesion = async () => {
    setCerrandoSesion(true);
    try {
      await onCerrarSesion();
    } catch {
      // Garantizar que la interfaz no quede bloqueada ante fallas de red
    } finally {
      setCerrandoSesion(false);
    }
  };

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
    await Promise.all([recargarMaterias(), recargarRecetas()]);
  };

  const handleAbrirAjusteStock = (producto: Producto) => {
    setProductoAAjustarStock(producto);
    setModalAjusteStockAbierto(true);
  };

  const handleCerrarAjusteStock = () => {
    setModalAjusteStockAbierto(false);
    setProductoAAjustarStock(null);
  };

  const handleGuardarAjusteStock = async (datos: AjusteStockProductoInput) => {
    if (!productoAAjustarStock) return;
    await ajustarStockProducto(productoAAjustarStock.id, datos);
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
      await recargarMaterias();
      await recargarRecetas();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al anular el lote de producción.';
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

  // Handlers para el módulo de Ventas y Cobranzas
  const handleAbrirNuevaVenta = () => {
    setModalNuevaVentaAbierto(true);
  };

  const handleCerrarNuevaVenta = () => {
    setModalNuevaVentaAbierto(false);
  };

  const handleGuardarVenta = async (datos: NuevaVentaInput) => {
    await registrarVenta(datos);
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
      let materiaVinculada: MateriaPrima | undefined;
      if (gastoAEliminar.compraMateriaPrima) {
        materiaVinculada = materiasPrimas.find(
          (m) => m.id === gastoAEliminar.compraMateriaPrima?.materiaPrimaId
        );
      }
      await eliminarGasto(gastoAEliminar.id, materiaVinculada);
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

  const fondosActuales = obtenerFondosPestana(pestana);

  return (
    <div className="min-h-screen flex flex-col bg-marca-beige text-stone-800 relative selection:bg-marca-tomate selection:text-white">
      {/* Fondos dinámicos fijos según solapa activa */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-fixed transition-all duration-500 block lg:hidden"
        style={{ backgroundImage: `url('${fondosActuales.mobile}')` }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-fixed transition-all duration-500 hidden lg:block"
        style={{ backgroundImage: `url('${fondosActuales.desktop}')` }}
        aria-hidden="true"
      />
      {/* Capa de contraste mandatoria para legibilidad total de datos */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-marca-beige/40 backdrop-blur-[1px]"
        aria-hidden="true"
      />

      {/* Encabezado Principal Responsivo (Desktop y Mobile) */}
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 px-3 sm:px-6 py-2.5 lg:py-3 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo e Identidad Visual */}
          <div className="flex items-center space-x-3 shrink-0">
            <img
              src="/logos/png rojo.svg"
              alt="Logo Lo de Caro"
              className="h-9 sm:h-10 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold font-titular text-marca-tomate leading-tight tracking-tight">
                Lo de Caro
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium">
                Obrador &amp; Cocina Casera
              </p>
            </div>
          </div>

          {/* Barra Horizontal de Pestañas (Desktop >= 1024px) */}
          <nav
            className="hidden lg:flex items-center space-x-1 bg-stone-100/90 p-1.5 rounded-xl border border-stone-200/60"
            aria-label="Módulos del Obrador"
          >
            {MODULOS.map((item) => {
              const activa = pestana === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPestana(item.id)}
                  type="button"
                  aria-current={activa ? 'page' : undefined}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 flex items-center gap-2
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      activa
                        ? 'bg-marca-tomate text-white shadow-sm hover:bg-[#a82e20] active:bg-[#92261a]'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/80 active:bg-white'
                    }`}
                >
                  {item.icono(activa)}
                  <span>{item.labelDesktop}</span>
                </button>
              );
            })}
          </nav>

          {/* Avatar de Caro, Identificador y Cierre de Sesión */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <img
                  src="/personajes/personaje_principal.png"
                  alt="Caro"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-marca-canela/30 bg-marca-beige shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"
                  title="Sesión activa en el Obrador"
                  aria-label="Estado: En línea"
                />
              </div>
              <div className="hidden xl:block text-left">
                <span className="block text-xs font-bold text-stone-800 leading-tight">Caro</span>
                {usuario.email && (
                  <span
                    className="block text-[11px] text-stone-500 truncate max-w-[140px]"
                    title={usuario.email}
                  >
                    {usuario.email}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleCerrarSesion}
              disabled={cerrandoSesion}
              type="button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-700 transition-colors
                hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300
                active:bg-stone-100
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4 sm:mr-1.5 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">
                {cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Área de Contenido Principal con padding inferior mobile para proteger la bottom bar */}
      <main className="flex-1 max-w-2xl md:max-w-3xl lg:max-w-6xl w-full mx-auto p-4 pb-24 lg:pb-8 relative z-10">
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

        {pestana === 'finanzas' && (
          <TableroFinanzas
            ventas={ventas}
            gastos={gastos}
          />
        )}
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

      {/* Sticky Bottom Navigation Bar en Mobile (< 1024px) */}
      <nav
        className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 lg:hidden px-1 py-1"
        style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
        aria-label="Navegación táctil del obrador"
      >
        <div className="grid grid-cols-6 items-center">
          {MODULOS.map((item) => {
            const activa = pestana === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPestana(item.id)}
                type="button"
                aria-current={activa ? 'page' : undefined}
                aria-label={item.labelDesktop}
                className={`min-h-[48px] py-1 px-0.5 flex flex-col items-center justify-center rounded-lg transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-tomate focus-visible:ring-offset-1
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    activa
                      ? 'text-marca-tomate font-bold'
                      : 'text-stone-500 font-medium hover:text-stone-800 hover:bg-stone-50 active:bg-stone-100'
                  }`}
              >
                <div
                  className={`p-1 rounded-md transition-colors ${
                    activa ? 'bg-marca-tomate/10 text-marca-tomate' : 'text-stone-500'
                  }`}
                >
                  {item.icono(activa)}
                </div>
                <span className="text-[10px] leading-tight tracking-tight truncate max-w-full mt-0.5">
                  {item.labelMobile}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Pie de página con identidad sutil */}
      <footer className="relative z-10 text-center py-4 text-xs text-stone-500 pb-28 lg:pb-4">
        Lo de Caro &copy; 2026 — Obrador Digital &amp; Cocina Casera
      </footer>
    </div>
  );
};
