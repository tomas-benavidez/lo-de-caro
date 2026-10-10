# Tareas de Implementación: Módulo de Producción y Stock de Congelados

- **Módulo:** SPEC-003 / PLAN-003
- **Regla Mandatoria:** Una sola tarea por iteración. Cada tarea implementada con TDD con Vitest, los 5 estados obligatorios en cada control UI, mobile-first estricto (375px a 420px) y reporte de cierre con CÓMO, POR QUÉ y PARA QUÉ.

---

## Lista Atómica de Tareas

- [x] **Tarea 1: Modelo de Dominio y Servicios de Producción (TDD)**
  * **Descripción:** Crear [`src/domain/models/loteProduccion.ts`](file:///home/tomas/lo-de-caro/src/domain/models/loteProduccion.ts) con las entidades y tipos `LoteProduccion`, `ItemConsumoIngrediente`, `EstadoStockCongelado`. Implementar [`src/domain/services/produccionServicio.ts`](file:///home/tomas/lo-de-caro/src/domain/services/produccionServicio.ts) para calcular el consumo exacto de ingredientes según la cantidad cocinada, clasificar stock del freezer y validar disponibilidad de insumos.
  * **Criterio de Aceptación:** Tests unitarios de dominio cubriendo cálculo de consumos, redondeo de unidades, alerta de insumos insuficientes y clasificación de stock congelado pasando en Vitest.
  * **Verificación:** `npm test tests/domain/` 100% aprobado (35 tests en total).
  * **Archivos:** `src/domain/models/loteProduccion.ts`, `src/domain/services/produccionServicio.ts`, `tests/domain/produccionServicio.test.ts`.

- [x] **Tarea 2: Repositorio de Infraestructura `LoteProduccionRepositorio` con Supabase (TDD)**
  * **Descripción:** Implementar [`src/infrastructure/repositories/loteProduccionRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/loteProduccionRepositorio.ts) con métodos `listarLotes()`, `registrarProduccion()`, y `eliminarLote()`. Implementar el doble impacto atómico: descuenta materias primas y suma stock en productos, con rollback defensivo ante errores de red o inconsistencias.
  * **Criterio de Aceptación:** Tests unitarios en Vitest con mocks de Supabase validando listado con joins, registro de lote con descuento/suma y rollback ante fallo.
  * **Verificación:** `npm test tests/infrastructure/` 100% aprobado (41 tests en total).
  * **Archivos:** `src/infrastructure/repositories/loteProduccionRepositorio.ts`, `tests/infrastructure/loteProduccionRepositorio.test.ts`.

- [x] **Tarea 3: Hook de Aplicación `useProduccion`**
  * **Descripción:** Crear [`src/presentation/hooks/useProduccion.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useProduccion.ts) para gestionar el estado de lotes elaborados, integración con productos y materias primas, y operaciones de registro/eliminación con manejo de carga y errores sin recarga de pantalla.
  * **Criterio de Aceptación:** Hook funcional, tipado estricto en TypeScript, sin dependencias externas innecesarias (Ponytail).
  * **Verificación:** `npm test` y `npm run build` sin errores de compilación (100% pasando).
  * **Archivos:** `src/presentation/hooks/useProduccion.ts`.

- [x] **Tarea 4: Componente `ListaProduccion` (Mobile-First y Accesible)**
  * **Descripción:** Crear [`src/presentation/components/ListaProduccion.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaProduccion.tsx) con dos secciones mobile-first: resumen visual de "Stock de Congelados" (unidades en freezer, estado REPONER/OK/SIN STOCK) e "Historial de Lotes Elaborados" con fecha, plato, unidades cocinadas y botón para eliminar lote.
  * **Criterio de Aceptación:** UI limpia mobile-first sin cards sobre cards, áreas táctiles mínimas de 44x44px y 5 estados interactivos en botones.
  * **Verificación:** Compilación limpia y renderizado correcto (100% pasando).
  * **Archivos:** `src/presentation/components/ListaProduccion.tsx`.

- [x] **Tarea 5: Componente `ModalRegistroProduccion` (Simulador de Consumo y 5 Estados)**
  * **Descripción:** Crear [`src/presentation/components/ModalRegistroProduccion.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalRegistroProduccion.tsx) para registrar una tanda cocinada: selector de producto con receta, cantidad elaborada con botones rápidos (+1, +5, +10), fecha, notas y visor en vivo de materias primas que se descontarán con alertas si el stock es insuficiente.
  * **Criterio de Aceptación:** Modal accesible (`role="dialog"`, `aria-modal="true"`, foco y `Escape`), los 5 estados obligatorios en cada control UI y validaciones en español.
  * **Verificación:** Compilación TypeScript estricta y pruebas de interacción (100% pasando).
  * **Archivos:** `src/presentation/components/ModalRegistroProduccion.tsx`.

- [x] **Tarea 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools**
  * **Descripción:** Conectar `ListaProduccion`, `ModalRegistroProduccion` y `ModalConfirmacion` en la solapa "Producción" de [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx). Sincronizar recarga de stock entre solapas (Materias Primas y Recetas). El `@reviewer` audita en caliente con `chrome-devtools`, corre la suite completa de tests y genera el reporte oficial en `REPORTE_VERIFICACION_SDD.md`.
  * **Criterio de Aceptación:** Flujo operativo completo de punta a punta, 0 errores de consola, árbol a11y correcto y reporte formal emitido (100% pasando).
  * **Verificación:** `npm test`, `npm run build`, auditoría DevTools en `http://localhost:5173/` (41 tests passing, 0 errores en consola).
  * **Archivos:** `src/App.tsx`, `REPORTE_VERIFICACION_SDD.md`.
