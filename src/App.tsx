import React, { useState } from 'react';
import { MateriaPrima } from './domain/models/materiaPrima.ts';
import { Producto } from './domain/models/producto.ts';
import { LoteProduccion } from './domain/models/loteProduccion.ts';
import { Boton } from './presentation/components/Boton.tsx';
import { useMateriasPrimas } from './presentation/hooks/useMateriasPrimas.ts';
import { useProductosRecetas } from './presentation/hooks/useProductosRecetas.ts';
import { useProduccion } from './presentation/hooks/useProduccion.ts';
import { ListaMateriasPrimas } from './presentation/components/ListaMateriasPrimas.tsx';
import { ListaRecetas } from './presentation/components/ListaRecetas.tsx';
import { ListaProduccion } from './presentation/components/ListaProduccion.tsx';
import { ModalNuevaMateriaPrima } from './presentation/components/ModalNuevaMateriaPrima.tsx';
import { ModalReceta } from './presentation/components/ModalReceta.tsx';
import { ModalRegistroProduccion } from './presentation/components/ModalRegistroProduccion.tsx';
import { ModalConfirmacion } from './presentation/components/ModalConfirmacion.tsx';

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
    eliminarProductoReceta,
  } = useProductosRecetas();

  // Estados para el módulo de Producción y Stock de Congelados
  const [modalProduccionAbierto, setModalProduccionAbierto] = useState(false);
  const [productoIdAProducir, setProductoIdAProducir] = useState<string | null>(null);
  const [loteAEliminar, setLoteAEliminar] = useState<LoteProduccion | null>(null);
  const [confirmandoEliminacionLote, setConfirmandoEliminacionLote] = useState(false);
  const [errorEliminacionLote, setErrorEliminacionLote] = useState<string | null>(null);

  // Hook de ciclo de vida y datos para el módulo de producción
  const {
    lotes,
    cargando: cargandoProduccion,
    error: errorProduccion,
    recargar: recargarProduccion,
    registrarProduccion,
    eliminarLote,
  } = useProduccion();

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
            onEliminarLote={handleAbrirEliminarLote}
            onReintentar={() => {
              recargarProduccion();
              recargarMaterias();
              recargarRecetas();
            }}
          />
        )}

        {pestana === 'ventas' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Ventas y Clientes</h2>
                <p className="text-xs text-stone-500">Salida de congelados y control de cobros o deudores</p>
              </div>
              <Boton variante="primario" tamano="chico">
                + Nueva Venta
              </Boton>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 text-center text-sm text-stone-500">
              Módulo de mostrador para registrar ventas cobradas o pendientes por cliente.
            </div>
          </section>
        )}

        {pestana === 'gastos' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Libro Diario de Gastos</h2>
                <p className="text-xs text-stone-500">Compras de insumos, packaging y servicios del local</p>
              </div>
              <Boton variante="primario" tamano="chico">
                + Nuevo Gasto
              </Boton>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 text-center text-sm text-stone-500">
              Módulo preparado para compras de insumos (con impacto directo en stock) y gastos operativos.
            </div>
          </section>
        )}

        {pestana === 'finanzas' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">Balance y Meta Mensual</h2>
              <p className="text-xs text-stone-500">Seguimiento de la meta de retiro ($300.000) y flujo de caja</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-stone-600">Meta de Retiro Mensual</span>
                <span className="text-sm font-bold text-marca-canela">$300.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-stone-600">Ventas Estimadas Necesarias</span>
                <span className="text-sm font-semibold text-stone-900">~$992.000 / mes</span>
              </div>
            </div>
          </section>
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

      {/* Modal accesible de confirmación de eliminación de lote de producción */}
      <ModalConfirmacion
        abierto={Boolean(loteAEliminar)}
        titulo="Eliminar Lote de Producción"
        mensaje={
          loteAEliminar
            ? `¿Estás segura de que deseás eliminar el lote de "${loteAEliminar.nombreProducto}" (${loteAEliminar.cantidadElaborada} ${loteAEliminar.unidadVenta}) del ${loteAEliminar.fecha}? Esta acción borrará el registro del historial.`
            : ''
        }
        textoConfirmar="Eliminar definitivamente"
        textoCancelar="Cancelar"
        confirmando={confirmandoEliminacionLote}
        error={errorEliminacionLote}
        onConfirmar={handleConfirmarEliminacionLote}
        onCancelar={handleCancelarEliminacionLote}
      />

      {/* Pie de página con identidad sutil */}
      <footer className="text-center py-4 text-xs text-stone-400">
        Lo de Caro &copy; 2026 — Sistema de Gestión Gastronómica
      </footer>
    </div>
  );
};

export default App;
