# Tareas de Implementación: Módulo de Gastos y Egresos Operativos

- **Módulo:** SPEC-005 / PLAN-005
- **Regla Mandatoria:** TDD con Vitest, los 5 estados obligatorios en cada control UI, mobile-first estricto (375px a 420px) y reporte de cierre con CÓMO, POR QUÉ y PARA QUÉ.

---

## Lista Atómica de Tareas

- [x] **Tarea 1: Modelo de Dominio y Servicios de Gastos y Egresos (TDD)**
  * **Descripción:** Crear [`src/domain/models/gasto.ts`](file:///home/tomas/lo-de-caro/src/domain/models/gasto.ts) con las entidades `Gasto`, `NuevoGastoInput`, `CategoriaGasto`, `MetodoPagoGasto` y `ResumenGastos`. Implementar [`src/domain/services/gastoServicio.ts`](file:///home/tomas/lo-de-caro/src/domain/services/gastoServicio.ts) para cálculo de resúmenes financieros de egresos, cálculo del nuevo costo unitario de materias primas, filtrado y validación de datos.
  * **Criterio de Aceptación:** Tests unitarios de dominio en Vitest cubriendo cálculo de totales por categoría, métodos de pago, cálculo de costo unitario por compra y validación de reglas de negocio.
  * **Verificación:** `npm test tests/domain/gastoServicio.test.ts` 100% aprobado (17 tests pasando).
  * **Archivos:** `src/domain/models/gasto.ts`, `src/domain/services/gastoServicio.ts`, `tests/domain/gastoServicio.test.ts`.

- [x] **Tarea 2: Repositorio de Infraestructura `gastoRepositorio` con Supabase (TDD)**
  * **Descripción:** Implementar [`src/infrastructure/repositories/gastoRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/gastoRepositorio.ts). Soporte para listar gastos, registrar gastos estándar y con impacto directo en stock/costo de `materias_primas`, persistencia segura de metadatos (método de pago, detalle de compra), anulación de gastos con restitución de stock de materias primas y rollback defensivo ante fallos.
  * **Criterio de Aceptación:** Tests unitarios en Vitest con mocks de Supabase validando inserción, actualización atómica de materia prima, rollback ante error y anulación con restitución.
  * **Verificación:** `npm test tests/infrastructure/gastoRepositorio.test.ts` 100% aprobado (8 tests pasando).
  * **Archivos:** `src/infrastructure/repositories/gastoRepositorio.ts`, `tests/infrastructure/gastoRepositorio.test.ts`.

- [x] **Tarea 3: Hook de Aplicación `useGastos`**
  * **Descripción:** Crear [`src/presentation/hooks/useGastos.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useGastos.ts) para orquestar el estado de gastos, resumen financiero, sincronización tras operaciones de registro o anulación, y manejo inmutable de errores.
  * **Criterio de Aceptación:** Hook funcional, tipado estricto en TypeScript sin `any`, cero sobreingeniería (Ponytail).
  * **Verificación:** Compilación TypeScript estricta (`tsc --noEmit`) 100% pasando sin errores.
  * **Archivos:** `src/presentation/hooks/useGastos.ts`.

- [x] **Tarea 4: Componente Accesible `ModalNuevoGasto` (5 Estados UI)**
  * **Descripción:** Crear [`src/presentation/components/ModalNuevoGasto.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalNuevoGasto.tsx) con soporte WAI-ARIA (`role="dialog"`, `aria-modal="true"`, foco cautivo y `Escape`), selector de categoría, vinculación opcional con catálogo de materias primas para sumar stock y recalcular costo unitario, método de pago (Efectivo/Transferencia) y los 5 estados obligatorios en cada control UI.
  * **Criterio de Aceptación:** Modal accesible, reactivo, validaciones en español y cálculo dinámico de costo unitario previo a guardar.
  * **Verificación:** Compilación TypeScript estricta (`tsc --noEmit`) 100% pasando sin errores.
  * **Archivos:** `src/presentation/components/ModalNuevoGasto.tsx`.

- [x] **Tarea 5: Componente Principal `ListaGastos` (Mobile-First y 5 Estados)**
  * **Descripción:** Crear [`src/presentation/components/ListaGastos.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaGastos.tsx) mobile-first (375px a 420px), sin anidamiento excesivo de tarjetas (*cards sobre cards*). Métricas de cabecera (Total Egresos, Materia Prima, Operativos, Efectivo vs Transferencia), buscador por concepto, chips de filtrado por categoría y método de pago, e indicación clara de impacto en inventario.
  * **Criterio de Aceptación:** UI intuitiva, botones con áreas táctiles mínimas de 44x44px y 5 estados interactivos.
  * **Verificación:** Compilación TypeScript estricta (`tsc --noEmit`) 100% pasando sin errores.
  * **Archivos:** `src/presentation/components/ListaGastos.tsx`.

- [x] **Tarea 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools**
  * **Descripción:** Conectar `ListaGastos`, `ModalNuevoGasto` y `ModalConfirmacion` en la solapa "Gastos" de [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx). Sincronizar recarga de `materias_primas` e integrar métricas de gastos en el resumen del balance de la solapa "Finanzas". El `@reviewer` audita en caliente con `chrome-devtools`, corre `npm test` y `npm run build`, y actualiza `REPORTE_VERIFICACION_SDD.md`.
  * **Criterio de Aceptación:** Flujo operativo completo de punta a punta, 0 errores de consola, árbol a11y correcto y reporte formal emitido (100% pasando).
  * **Verificación:** `npm test` (111 tests pasando), `npm run build` (0 errores/advertencias), auditoría en caliente verificada en DevTools (0 errores de consola, sincronización probada).
  * **Archivos:** `src/App.tsx`, `REPORTE_VERIFICACION_SDD.md`.
