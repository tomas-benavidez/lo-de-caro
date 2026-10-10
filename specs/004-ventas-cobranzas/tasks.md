# Tareas de Implementación: Módulo de Ventas y Cobranzas

- **Módulo:** SPEC-004 / PLAN-004
- **Regla Mandatoria:** TDD con Vitest, los 5 estados obligatorios en cada control UI, mobile-first estricto (375px a 420px) y reporte de cierre con CÓMO, POR QUÉ y PARA QUÉ.

---

## Lista Atómica de Tareas

- [x] **Tarea 1: Modelos de Dominio y Servicios de Ventas y Cobranzas (TDD)**
  * **Descripción:** Crear [`src/domain/models/cliente.ts`](file:///home/tomas/lo-de-caro/src/domain/models/cliente.ts) y [`src/domain/models/venta.ts`](file:///home/tomas/lo-de-caro/src/domain/models/venta.ts) con las entidades, tipos de estado de cobranza y métodos de pago. Implementar [`src/domain/services/ventaServicio.ts`](file:///home/tomas/lo-de-caro/src/domain/services/ventaServicio.ts) para calcular total de venta, validación de stock disponible en freezer, cálculo de resúmenes financieros y deudas.
  * **Criterio de Aceptación:** Tests unitarios de dominio en Vitest cubriendo cálculo de totales normales y de regalo, redondeo de precios, validación de disponibilidad y resumen de mostrador.
  * **Verificación:** `npm test tests/domain/ventaServicio.test.ts` 100% aprobado (13 tests pasando).
  * **Archivos:** `src/domain/models/cliente.ts`, `src/domain/models/venta.ts`, `src/domain/services/ventaServicio.ts`, `tests/domain/ventaServicio.test.ts`.

- [x] **Tarea 2: Repositorios de Infraestructura `clienteRepositorio` y `ventaRepositorio` (TDD)**
  * **Descripción:** Implementar [`src/infrastructure/repositories/clienteRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/clienteRepositorio.ts) y [`src/infrastructure/repositories/ventaRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/ventaRepositorio.ts). Soporte para listar clientes y ventas con joins relacionales, inserción atómica de ventas con descuento de `stock_actual` en productos, actualización de cuenta corriente si es `Pendiente`, registro de pagos de deudas, y rollback defensivo integral ante fallos.
  * **Criterio de Aceptación:** Tests unitarios en Vitest con mocks de Supabase validando flujo de inserción de ventas, actualización de saldos, descuento y restitución de stock de freezer y rollback ante error.
  * **Verificación:** `npm test tests/infrastructure/clienteRepositorio.test.ts` y `ventaRepositorio.test.ts` 100% aprobado (11 tests pasando).
  * **Archivos:** `src/infrastructure/repositories/clienteRepositorio.ts`, `src/infrastructure/repositories/ventaRepositorio.ts`, `tests/infrastructure/clienteRepositorio.test.ts`, `tests/infrastructure/ventaRepositorio.test.ts`.

- [x] **Tarea 3: Hook de Aplicación `useVentasCobranzas`**
  * **Descripción:** Crear [`src/presentation/hooks/useVentasCobranzas.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useVentasCobranzas.ts) para gestionar el estado de ventas, clientes, métricas resumidas y sincronización en memoria tras operaciones de registro o anulación.
  * **Criterio de Aceptación:** Hook funcional, tipado estricto en TypeScript, sin dependencias externas innecesarias (Ponytail).
  * **Verificación:** Compilación TypeScript estricta (`tsc --noEmit`) 100% pasando sin errores.
  * **Archivos:** `src/presentation/hooks/useVentasCobranzas.ts`.

- [x] **Tarea 4: Componentes de Modales Accesibles (`ModalNuevaVenta`, `ModalNuevoCliente`, `ModalCobrarDeuda`)**
  * **Descripción:** Crear los modales con soporte WAI-ARIA (`role="dialog"`, `aria-modal="true"`, foco cautivo y `Escape`), selector de cliente con opción mostrador, selector dinámico de ítems de venta con precios reales y stock, selector de método de pago (Efectivo/Transferencia) y estado (Cobrado/Pendiente/Regalo), y modal de cobro de deuda. Todos con los 5 estados obligatorios en cada control UI.
  * **Criterio de Aceptación:** Modales accesibles, interactivos y con validaciones en español.
  * **Verificación:** Compilación TypeScript estricta (`tsc --noEmit`) 100% pasando sin errores.
  * **Archivos:** `src/presentation/components/ModalNuevaVenta.tsx`, `src/presentation/components/ModalNuevoCliente.tsx`, `src/presentation/components/ModalCobrarDeuda.tsx`.

- [x] **Tarea 5: Componente Principal `ListaVentasCobranzas` (Mobile-First y 5 Estados)**
  * **Descripción:** Crear [`src/presentation/components/ListaVentasCobranzas.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaVentasCobranzas.tsx) con métricas de mostrador (Total cobrado, Dinero en la calle, Clientes deudores), navegación interna entre "Ventas Recientes" y "Clientes y Cuentas Corrientes", acciones directas de cobro y contacto por WhatsApp.
  * **Criterio de Aceptación:** UI limpia mobile-first sin cards sobre cards, áreas táctiles mínimas de 44x44px y 5 estados interactivos en botones y filtros.
  * **Verificación:** Compilación TypeScript estricta (`tsc --noEmit`) 100% pasando sin errores.
  * **Archivos:** `src/presentation/components/ListaVentasCobranzas.tsx`.

- [x] **Tarea 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools**
  * **Descripción:** Conectar `ListaVentasCobranzas`, los modales y `ModalConfirmacion` en la solapa "Ventas" de [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx). Sincronizar recarga de stock entre solapas (Producción y Recetas). El `@reviewer` audita en caliente con `chrome-devtools`, corre la suite completa de tests (`npm test`), compila (`npm run build`) y actualiza `REPORTE_VERIFICACION_SDD.md`.
  * **Criterio de Aceptación:** Flujo operativo completo de punta a punta, 0 errores de consola, árbol a11y correcto y reporte formal emitido (100% pasando).
  * **Verificación:** `npm test` (84 tests pasando), `npm run build` (cero errores/advertencias), auditoría DevTools en `http://localhost:5173/` (0 errores en consola, 0 issues).
  * **Archivos:** `src/App.tsx`, `REPORTE_VERIFICACION_SDD.md`.
