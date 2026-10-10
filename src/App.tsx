import React, { useState } from 'react';
import { Boton } from './presentation/components/Boton.tsx';
import { useMateriasPrimas } from './presentation/hooks/useMateriasPrimas.ts';
import { ListaMateriasPrimas } from './presentation/components/ListaMateriasPrimas.tsx';
import { ModalNuevaMateriaPrima } from './presentation/components/ModalNuevaMateriaPrima.tsx';

type PestanaActiva = 'materiasPrimas' | 'recetas' | 'produccion' | 'ventas' | 'finanzas';

export const App: React.FC = () => {
  const [pestana, setPestana] = useState<PestanaActiva>('materiasPrimas');
  const [modalInsumoAbierto, setModalInsumoAbierto] = useState(false);

  // Hook de ciclo de vida y datos para el módulo de materias primas
  const {
    materiasPrimas,
    cargando: cargandoMaterias,
    error: errorMaterias,
    recargar: recargarMaterias,
    crearMateriaPrima,
  } = useMateriasPrimas();

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
            onAbrirNuevoModal={() => setModalInsumoAbierto(true)}
            onReintentar={recargarMaterias}
          />
        )}

        {pestana === 'recetas' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Recetas y Costeo</h2>
                <p className="text-xs text-stone-500">Estandarización de ingredientes y margen por porción</p>
              </div>
              <Boton variante="primario" tamano="chico">
                + Nueva Receta
              </Boton>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 text-center text-sm text-stone-500">
              Módulo de recetas listo para vincular ingredientes con productos de venta.
            </div>
          </section>
        )}

        {pestana === 'produccion' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Lotes de Producción</h2>
                <p className="text-xs text-stone-500">Registrar lo cocinado descuenta insumos y suma al freezer</p>
              </div>
              <Boton variante="primario" tamano="chico">
                + Cocinar Lote
              </Boton>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 text-center text-sm text-stone-500">
              Módulo de producción listo para registrar tandas de cocina con doble impacto de stock.
            </div>
          </section>
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

      {/* Modal accesible de nueva materia prima */}
      <ModalNuevaMateriaPrima
        abierto={modalInsumoAbierto}
        onCerrar={() => setModalInsumoAbierto(false)}
        onGuardar={async (datos) => {
          await crearMateriaPrima(datos);
        }}
      />

      {/* Pie de página con identidad sutil */}
      <footer className="text-center py-4 text-xs text-stone-400">
        Lo de Caro &copy; 2026 — Sistema de Gestión Gastronómica
      </footer>
    </div>
  );
};

export default App;
