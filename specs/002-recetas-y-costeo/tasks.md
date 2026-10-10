# Tareas de Implementación: Módulo de Recetas y Costeo

- **Módulo:** SPEC-002 / PLAN-002
- **Regla Mandatoria:** Una sola tarea por iteración. Cada tarea implementada con `/boost` obligatorio, TDD con Vitest, los 5 estados obligatorios en cada control UI, mobile-first estricto (375px a 420px) y reporte de cierre con CÓMO, POR QUÉ y PARA QUÉ.

---

## Lista Atómica de Tareas

- [x] **Tarea 1: Modelo de Dominio y Extensión del Calculador de Costos**
  * **Descripción:** Actualizar [`src/domain/models/producto.ts`](file:///home/tomas/lo-de-caro/src/domain/models/producto.ts) para soportar todas las unidades de medida en ingredientes (`g`, `ml`, `u`, `kg`, `l`). Extender [`src/domain/services/calculadorCostos.ts`](file:///home/tomas/lo-de-caro/src/domain/services/calculadorCostos.ts) con función clasificadora de margen (`clasificarMargen`) para categorizar márgenes en saludable, advertencia o pérdida.
  * **Criterio de Aceptación:** Tests unitarios de dominio cubriendo cálculo con distintas unidades y clasificación de márgenes pasando en Vitest.
  * **Verificación:** `npm test tests/domain/` 100% aprobado.
  * **Archivos:** `src/domain/models/producto.ts`, `src/domain/services/calculadorCostos.ts`, `tests/domain/calculadorCostos.test.ts`.

- [x] **Tarea 2: Repositorio de Infraestructura `ProductoRepositorio` con Supabase (TDD)**
  * **Descripción:** Implementar [`src/infrastructure/repositories/productoRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/productoRepositorio.ts) con métodos `listar()`, `crear()`, `actualizar()` y `eliminar()`. Mapear las tablas `productos` y `receta_ingredientes` (con join a `materias_primas`) a la entidad `Producto`.
  * **Criterio de Aceptación:** Tests unitarios en Vitest simulando cliente de Supabase y validando inserción de producto + ingredientes y manejo de errores.
  * **Verificación:** `npm test tests/infrastructure/` 100% aprobado.
  * **Archivos:** `src/infrastructure/repositories/productoRepositorio.ts`, `tests/infrastructure/productoRepositorio.test.ts`.

- [x] **Tarea 3: Hook de Aplicación `useProductosRecetas`**
  * **Descripción:** Crear [`src/presentation/hooks/useProductosRecetas.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useProductosRecetas.ts) para gestionar el estado de productos con recetas, integración con materias primas para la selección de insumos, y operaciones CRUD reactivas con manejo de errores y estados de carga.
  * **Criterio de Aceptación:** Hook funcional sin dependencias pesadas (Ponytail), estado inmutable y TypeScript estricto.
  * **Verificación:** `npm test` y `npm run build` sin errores de tipado.
  * **Archivos:** `src/presentation/hooks/useProductosRecetas.ts`.

- [x] **Tarea 4: Componente `ListaRecetas` (Mobile-First y Accesible)**
  * **Descripción:** Crear [`src/presentation/components/ListaRecetas.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaRecetas.tsx) con visualización de productos por categoría, precio de venta, costo de elaboración, margen en $ y %, semáforo de margen, desglose accesible de ingredientes y botones para editar y eliminar.
  * **Criterio de Aceptación:** UI limpia mobile-first sin cards sobre cards, áreas táctiles mínimas de 44x44px y 5 estados interactivos.
  * **Verificación:** Compilación limpia y renderizado correcto.
  * **Archivos:** `src/presentation/components/ListaRecetas.tsx`.

- [x] **Tarea 5: Componente `ModalReceta` (Formulario Dinámico con 5 Estados)**
  * **Descripción:** Crear [`src/presentation/components/ModalReceta.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalReceta.tsx) para crear y editar recetas: datos comerciales, selector dinámico de materias primas, cálculo en vivo de costo y margen mientras se compone la receta, con los 5 estados obligatorios en cada botón e input.
  * **Criterio de Aceptación:** Accesible (`role="dialog"`, `aria-modal="true"`, foco y `Escape`), validaciones en español, bloqueo de envíos inválidos.
  * **Verificación:** Compilación TypeScript estricta y pruebas de interacción.
  * **Archivos:** `src/presentation/components/ModalReceta.tsx`.

- [x] **Tarea 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools**
  * **Descripción:** Conectar `ListaRecetas`, `ModalReceta` y `ModalConfirmacion` en la solapa "Recetas" de [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx). El `@reviewer` audita en caliente con `chrome-devtools`, corre la suite de pruebas completa y genera el reporte oficial en `REPORTE_VERIFICACION_SDD.md`.
  * **Criterio de Aceptación:** Flujo completo operativo de punta a punta, 0 errores de consola, árbol a11y correcto y reporte formal emitido.
  * **Verificación:** `npm test`, `npm run build`, auditoría DevTools en `http://localhost:4173/`.
  * **Archivos:** `src/App.tsx`, `REPORTE_VERIFICACION_SDD.md`.
