# Reporte Oficial de Verificación SDD: Recetas y Costeo (SPEC-002)

- **Módulo Principal:** `SPEC-002` (Estandarización de Recetas, Costeo por Porción y Márgenes Comerciales)
- **Módulo Previo:** `SPEC-001` / `SPEC-001.1` (Materias Primas e Insumos Base)
- **Fecha de Auditoría:** 2026-10-10
- **Auditor:** Subagente Verificador / Auditor (@reviewer)
- **Veredicto Final:** **APROBADO (100% Verificado y Listo para Producción)**

---

## 1. Alcance Auditado y Verificado (SPEC-002)

Se auditaron y validaron de punta a punta las 6 tareas atómicas definidas en [`specs/002-recetas-y-costeo/tasks.md`](file:///home/tomas/lo-de-caro/specs/002-recetas-y-costeo/tasks.md):

1. **Tarea 1: Modelo de Dominio y Extensión del Calculador de Costos**
   - Actualización de [`src/domain/models/producto.ts`](file:///home/tomas/lo-de-caro/src/domain/models/producto.ts) para soportar todas las unidades de medida en ingredientes (`g`, `ml`, `u`, `kg`, `l`) y tipado de `EstadoMargen`.
   - Extensión de [`src/domain/services/calculadorCostos.ts`](file:///home/tomas/lo-de-caro/src/domain/services/calculadorCostos.ts) con función clasificadora de margen (`clasificarMargen()`) que distingue `SALUDABLE` (>= 30%), `ADVERTENCIA` (< 30%) y `PERDIDA` (margen <= 0).
   - 6 pruebas unitarias de dominio pasando en Vitest.

2. **Tarea 2: Repositorio de Infraestructura `ProductoRepositorio` con Supabase (TDD)**
   - Implementación de [`src/infrastructure/repositories/productoRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/productoRepositorio.ts) con métodos `listar()`, `obtenerPorId()`, `crear()`, `actualizar()` y `eliminar()`.
   - Mapeo relacional con join PostgREST: `.select('*, receta_ingredientes(*, materias_primas(*))')`.
   - Sincronización de ingredientes de la receta con eliminación previa e inserción de nuevos ítems.
   - 6 pruebas unitarias de infraestructura pasando en Vitest con mocks del cliente Supabase.

3. **Tarea 3: Hook de Aplicación `useProductosRecetas`**
   - Creación de [`src/presentation/hooks/useProductosRecetas.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useProductosRecetas.ts) para orquestar la reactividad, ordenamiento alfabético, manejo inmutable del estado local y control de errores.

4. **Tarea 4: Componente `ListaRecetas` (Mobile-First y Accesible)**
   - Implementación de [`src/presentation/components/ListaRecetas.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaRecetas.tsx) mobile-first (375px a 420px), sin anidamiento excesivo de tarjetas (*cards sobre cards*).
   - Buscador en vivo por nombre de producto o ingrediente.
   - Filtro de categorías: `Todas`, `Pastas Rellenas`, `Pastas Lisas`, `Empanadas`, `Tartas`, `Salsas`.
   - Indicadores financieros por plato: Precio de Venta, Costo de Elaboración, Margen en pesos ($) y en porcentaje (%).
   - Semáforo de advertencias para márgenes ajustados o a pérdida.
   - Desglose accesible y expandible de la fórmula de receta con subtotales por ingrediente.

5. **Tarea 5: Componente `ModalReceta` (Formulario Dinámico con 5 Estados)**
   - Implementación de [`src/presentation/components/ModalReceta.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalReceta.tsx) con soporte para alta y edición de recetas.
   - Selector dinámico de insumos alimentado directamente por las materias primas registradas en la base de datos.
   - Calculadora financiera en vivo: al tipear precio o agregar/quitar ingredientes, actualiza inmediatamente el costo de insumos y el margen proyectado.
   - Cumplimiento de los 5 estados obligatorios en cada control UI: `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
   - Accesibilidad: `role="dialog"`, `aria-modal="true"`, foco automático en el primer input, cierre con tecla `Escape` y zona táctil mínima de 44x44px.

6. **Tarea 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools**
   - Conexión de `ListaRecetas`, `ModalReceta` y `ModalConfirmacion` en la solapa "Recetas" de [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx).
   - Auditoría en caliente en navegador real con Chrome DevTools en `http://localhost:4173/`.
   - Creación en vivo de una receta real ("Raviolones de Verdura y Ricotta") con persistencia en Supabase, verificación de apertura, edición y cancelación modal.

---

## 2. Evidencias Empíricas de Calidad

### Pruebas Unitarias Automatizadas (Vitest)
```bash
$ npm test

 RUN  v3.2.7 /home/tomas/lo-de-caro

 ✓ tests/domain/calculadorCostos.test.ts (8 tests) 8ms
   ✓ Servicio de Dominio: Calculador de Costos y Márgenes > debe calcular correctamente el costo de una receta sumando sus ingredientes
   ✓ Servicio de Dominio: Calculador de Costos y Márgenes > debe retornar 0 si la receta no tiene ingredientes
   ✓ Servicio de Dominio: Calculador de Costos y Márgenes > debe calcular el margen de ganancia en pesos y porcentaje correctamente
   ✓ Servicio de Dominio: Calculador de Costos y Márgenes > debe indicar REPONER cuando el stock actual es menor o igual al mínimo
   ✓ Servicio de Dominio: Calculador de Costos y Márgenes > debe calcular costo correctamente con unidades kg y l
   ✓ Servicio de Dominio: Calculador de Costos y Márgenes > debe clasificar los márgenes en SALUDABLE, ADVERTENCIA, PERDIDA, NEUTRO y SIN_RECETA
   ✓ Servicio de Dominio: Calculador de Costos y Márgenes > debe redondear el costo a 2 decimales ante números con muchos decimales
   ✓ Servicio de Dominio: Calculador de Costos y Márgenes > debe calcular margen de ganancia cuando el precio de venta es 0 pero hay costo
 ✓ tests/infrastructure/materiaPrimaRepositorio.test.ts (11 tests) 27ms
   ✓ mapea correctamente una fila snake_case de Postgres a la entidad de dominio camelCase
   ✓ mapea un input del dominio a formato persistible en Postgres
   ✓ mapea un input parcial del dominio a formato persistible en Postgres
   ✓ debe listar materias primas ordenadas alfabéticamente a través del cliente
   ✓ debe lanzar error cuando el listado de Supabase falla
   ✓ debe insertar una nueva materia prima y retornar la entidad creada
   ✓ debe actualizar los campos de una materia prima existente y retornar la entidad
   ✓ debe lanzar error cuando falla la actualización en Supabase
   ✓ debe eliminar una materia prima por su id exitosamente
   ✓ debe capturar error Postgres 23503 y lanzar mensaje amigable sobre recetas asociadas
   ✓ debe lanzar error genérico cuando falla la eliminación por otro motivo
 ✓ tests/infrastructure/productoRepositorio.test.ts (9 tests) 27ms
   ✓ ProductoRepositorio & Mapeadores > mapea correctamente una fila con join de recetas y materias primas a la entidad Producto
   ✓ ProductoRepositorio & Mapeadores > mapea correctamente un producto sin ingredientes asociados
   ✓ ProductoRepositorio & Mapeadores > mapea un input del dominio a formato persistible en Postgres
   ✓ ProductoRepositorio & Mapeadores > debe listar productos activos con sus recetas a través del cliente
   ✓ ProductoRepositorio & Mapeadores > debe crear un producto con sus ingredientes asociados
   ✓ ProductoRepositorio & Mapeadores > debe eliminar un producto por su id exitosamente
   ✓ ProductoRepositorio & Mapeadores > debe consolidar ingredientes duplicados sumando sus cantidades y filtrando no válidos
   ✓ ProductoRepositorio & Mapeadores > debe hacer rollback eliminando el producto creado si falla la inserción de ingredientes
   ✓ ProductoRepositorio & Mapeadores > debe actualizar los datos de un producto y sincronizar sus ingredientes

 Test Files  3 passed (3)
      Tests  28 passed (28)
   Duration  848ms
```
- **Total de pruebas:** 28 tests automatizados ejecutados y 100% aprobados.

---

### Compilación y Bundle de Producción (`tsc && vite build`)
```bash
$ npm run build

> lo-de-caro@0.1.0 build
> tsc && vite build

vite v6.4.4 building for production...
✓ 84 modules transformed.
dist/registerSW.js                  0.13 kB
dist/manifest.webmanifest           0.45 kB
dist/index.html                     1.21 kB │ gzip:  0.63 kB
dist/assets/index-C4aGpZdt.css     21.40 kB │ gzip:  4.60 kB
dist/assets/supabase-B12s50R_.js  226.70 kB │ gzip: 58.90 kB
dist/assets/index-h0j1rlsO.js     277.60 kB │ gzip: 81.50 kB
✓ built in 2.22s

PWA v0.21.2
mode      generateSW
precache  9 entries (514.70 KiB)
files generated: dist/sw.js, dist/workbox-9c191d2f.js
```
- **Exit code:** 0 (0 errores de tipos TypeScript, 0 advertencias de build, chunking optimizado sin advertencias de tamaño).

---

## 3. Auditoría en Vivo en Navegador (Chrome DevTools en `http://localhost:4173/`)

La auditoría se realizó en el entorno de producción (`vite preview`) con inspección directa vía Chrome DevTools MCP en viewport móvil (390x844px):

### A. Consola de JavaScript
- **Resultado:** **0 errores, 0 advertencias, 0 logs huérfanos**.
```json
{
  "console_messages": []
}
```

### B. Árbol de Accesibilidad (A11y Tree Snapshot)
- La solapa "Recetas" expone el landmark `region "Módulo de Recetas y Costeo"`.
- Los botones interactivos cuentan con roles semánticos y etiquetas legibles:
  - `button "Registrar nueva receta de producto"`
  - `searchbox "Buscar receta o ingrediente"`
  - `button "Editar receta [Nombre del Producto]"`
  - `button "Eliminar receta [Nombre del Producto]"`
  - `button "▶ Ver fórmula de receta (2 insumos)" expandable`
- Diálogo modal con `role="dialog"`, `aria-modal="true"`, foco cautivo inicial y soporte completo de tecla `Escape`.
- Zonas táctiles mínimas de 44x44px en botón de cerrar modal y botón de quitar insumos, con los 5 estados obligatorios (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`).
- Intercepción de tecla Enter en inputs para evitar cierres prematuros de formulario y permitir agregar ingredientes rápidamente con el teclado.
- Manejo preventivo de recetas sin ingredientes: muestra estado `Sin costear / Sin insumos` con alerta amigable en lugar de un falso margen saludable del 100%.

### C. Capturas de Pantalla Generadas
- [`evidencia_recetas_modal.png`](file:///home/tomas/lo-de-caro/evidencia_recetas_modal.png): Formulario modal con selector de materias primas y calculadora de costeo en vivo.
- [`evidencia_recetas_lista.png`](file:///home/tomas/lo-de-caro/evidencia_recetas_lista.png): Vista mobile-first del listado con métricas de precio, costo, margen ($ y %) y desglose desplegado de la fórmula de ingredientes.

---

## 4. Reporte Técnico de Cierre: CÓMO, POR QUÉ y PARA QUÉ

### Tarea 1 & Tarea 2: Modelo de Dominio, Costeo y Repositorio Supabase
- **CÓMO:** Se extendieron los modelos de TypeScript para unificar las unidades de medida (`kg`, `l`, `g`, `ml`, `u`), se implementó la clasificación de margen con soporte para `NEUTRO` y `SIN_RECETA`, consolidación automática de ingredientes duplicados (RF-05) y rollback defensivo en caso de error relacional en `ProductoRepositorio`.
- **POR QUÉ:** La Arquitectura Limpia exige que las reglas matemáticas de costos no dependan de la vista ni de la base de datos, y que la persistencia mantenga la integridad transaccional evitando registros huérfanos en Postgres.
- **PARA QUÉ:** Caro puede conocer con precisión matemática cuánto dinero cuesta elaborar cada plato según el precio actual de sus materias primas sin riesgo de inconsistencias de datos.

### Tarea 3 & Tarea 4: Hook Reactivo y Componente `ListaRecetas`
- **CÓMO:** Se desacopló la lógica de estado con el hook `useProductosRecetas`, y se diseñó la interfaz mobile-first con Tailwind CSS respetando la paleta oficial (`marca-canela`, `marca-beige`, `marca-tomate`, `marca-otono`, `marca-lima`), incorporando buscador en vivo, filtros por categoría con altura táctil accesible (>= 40px), tipografía correcta ("Porción") y prevención de falsos positivos en recetas pendientes de costeo.
- **POR QUÉ:** Evita la duplicación de código y el antipatrón de *cards sobre cards*, garantizando una visual limpia, de alto contraste y operable con una sola mano en cocina.
- **PARA QUÉ:** Permite a Caro revisar en segundos el margen de ganancia de cada plato en su freezer antes de fijar o actualizar precios de venta.

### Tarea 5 & Tarea 6: Modal Dinámico, Integración y Auditoría DevTools
- **CÓMO:** Se construyó `ModalReceta` con selector de insumos en tiempo real, totalizador de costo y margen interactivo mientras se añaden materias primas, validaciones estrictas, áreas táctiles de 44x44px, soporte de teclado (`Escape`, `Enter` para agregar insumos sin enviar formulario accidentalmente) y orden estricto de Hooks de React. Se optimizó el chunking de Vite aislando `@supabase/supabase-js`.
- **POR QUÉ:** Satisface la regla de los 5 estados interactivos obligatorios (`Default`, `Hover`, `Active`, `Focus`, `Disabled`), elimina advertencias de bundle y previene pérdida involuntaria de datos tipeados.
- **PARA QUÉ:** Caro puede estandarizar recetas completas directamente desde su celular en plena jornada de cocina sin errores de digitación ni pérdida de datos.

---

## 5. Veredicto Formal

```
=====================================================
               VEREDICTO SPEC-002: APROBADO
         Listo para Producción e Integración
=====================================================
```
- **Conformidad de Especificación:** 100% de requisitos cubiertos (`RF-01` a `RF-05`).
- **Pruebas Automatizadas:** 28/28 tests exitosos (0 fallas).
- **Compilación TypeScript / Vite:** 0 errores, 0 advertencias.
- **Auditoría Chrome DevTools:** 0 errores en consola, árbol de accesibilidad verificado.

---

# Reporte Oficial de Verificación SDD: Producción y Stock de Congelados (SPEC-003)

- **Módulo Principal:** `SPEC-003` (Registro de Lotes de Producción, Descuento Atómico de Insumos y Control de Freezer)
- **Módulos Previos:** `SPEC-001` (Materias Primas) y `SPEC-002` (Recetas y Costeo)
- **Fecha de Auditoría:** 2026-10-10
- **Auditor:** Subagente Verificador / Auditor (@reviewer)
- **Veredicto Final:** **APROBADO (100% Verificado, Probado en Caliente y Listo para Producción)**

---

## 1. Alcance Auditado y Verificado (SPEC-003)

Se auditaron y validaron de punta a punta las 6 tareas atómicas de [`specs/003-produccion-stock/tasks.md`](file:///home/tomas/lo-de-caro/specs/003-produccion-stock/tasks.md):

1. **Tarea 1: Modelo de Dominio y Servicios de Producción (TDD con Vitest)**
   - Creación de [`src/domain/models/loteProduccion.ts`](file:///home/tomas/lo-de-caro/src/domain/models/loteProduccion.ts) con las entidades y tipos `LoteProduccion`, `ItemConsumoIngrediente`, `EstadoStockCongelado`, `ResumenProduccionProyectada`.
   - Implementación de [`src/domain/services/produccionServicio.ts`](file:///home/tomas/lo-de-caro/src/domain/services/produccionServicio.ts) con las funciones puras `clasificarStockCongelado()` (`SIN_STOCK`, `REPONER`, `SALUDABLE`) y `calcularConsumoIngredientes()` con redondeo de precisión y detección de stock insuficiente.
   - 7 pruebas unitarias de dominio pasando en Vitest (`tests/domain/produccionServicio.test.ts`).

2. **Tarea 2: Repositorio de Infraestructura `LoteProduccionRepositorio` con Supabase (TDD)**
   - Implementación de [`src/infrastructure/repositories/loteProduccionRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/loteProduccionRepositorio.ts) con métodos `listarLotes()`, `obtenerLotePorId()`, `registrarProduccion()` y `eliminarLote()`.
   - Doble impacto de inventario transaccional: inserción de lote, incremento de stock de congelados en `productos`, y descuento proporcional de insumos en `materias_primas`.
   - Mecanismo de rollback defensivo ante fallos de red o inconsistencias.
   - 6 pruebas unitarias de infraestructura con mocks de Supabase pasando en Vitest (`tests/infrastructure/loteProduccionRepositorio.test.ts`).

3. **Tarea 3: Hook de Aplicación `useProduccion`**
   - Implementación de [`src/presentation/hooks/useProduccion.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useProduccion.ts) desacoplando la lógica de estado de los lotes de cocina, actualización inmutable de listas y sincronización reactiva.

4. **Tarea 4: Componente `ListaProduccion` (Mobile-First y Accesible)**
   - Creación de [`src/presentation/components/ListaProduccion.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaProduccion.tsx) con dos vistas:
     - **Stock de Congelados:** Catálogo de productos listos en freezer, unidades actuales, stock mínimo de seguridad, badges semafóricos (`SIN STOCK`, `REPONER`, `STOCK OK`) y botón de acceso rápido "+ Cocinar".
     - **Historial de Lotes:** Registro cronológico de tandas con fecha amigable (DD/MM/YYYY), cantidad elaborada (`+10 Porcion`), observaciones del lote y botón accesible de eliminación.
     - Buscador en vivo por plato, notas o fechas, y filtros de conveniencia.

5. **Tarea 5: Componente `ModalRegistroProduccion` (Simulador de Consumo y 5 Estados)**
   - Implementación de [`src/presentation/components/ModalRegistroProduccion.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalRegistroProduccion.tsx) con:
     - Selector dinámico de platos que cuentan con receta registrada.
     - Input de cantidad a cocinar con botones de toque táctil (+1, +5, +10) ideales para cocina móvil.
     - Selector de fecha con valor por defecto de hoy y campo opcional de notas.
     - **Simulador de Consumo en Vivo:** Desglose en tiempo real de cada materia prima a descontar, mostrando stock actual en alacena, consumo proyectado y stock restante tras el lote.
     - Detección visual y alerta explícita si algún insumo tiene stock insuficiente, con checkbox de confirmación consciente.
     - Cumplimiento de los 5 estados obligatorios en cada control UI (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`).
     - Soporte completo de teclado (`Escape`), foco cautivo inicial y zonas táctiles mínimas de 44x44px.

6. **Tarea 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools**
   - Conexión de `ListaProduccion`, `ModalRegistroProduccion` y `ModalConfirmacion` en la solapa "Producción" de [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx).
   - Sincronización cruzada: al registrar o anular un lote, se refrescan en paralelo las solapas de "Materias Primas" y "Recetas".
   - Auditoría en caliente en navegador real con Chrome DevTools en `http://localhost:5173/`.
   - Ejecución exitosa de una tanda real de cocina ("Raviolones de Verdura y Ricotta", 10 porciones), constatando el descuento atómico de 3 kg de Harina y 20 Huevos en Supabase en vivo y la actualización a "STOCK OK" en el freezer.

---

## 2. Evidencias Empíricas de Calidad
 
### Pruebas Unitarias Automatizadas (Vitest)
```bash
$ npm test

 RUN  v3.2.7 /home/tomas/lo-de-caro

 ✓ tests/domain/calculadorCostos.test.ts (8 tests)
 ✓ tests/domain/produccionServicio.test.ts (7 tests)
 ✓ tests/infrastructure/materiaPrimaRepositorio.test.ts (11 tests)
 ✓ tests/infrastructure/productoRepositorio.test.ts (9 tests)
 ✓ tests/infrastructure/loteProduccionRepositorio.test.ts (9 tests)

 Test Files  5 passed (5)
      Tests  44 passed (44)
   Duration  1.05s
```
- **Total de pruebas:** 44 tests automatizados ejecutados y 100% aprobados (incluyendo restitución de insumos al anular lotes, validación de stock en freezer y rollback defensivo).

---

### Compilación y Bundle de Producción (`tsc && vite build`)
```bash
$ npm run build

> lo-de-caro@0.1.0 build
> tsc && vite build

vite v6.4.4 building for production...
✓ 89 modules transformed.
dist/index.html                     1.21 kB │ gzip:  0.63 kB
dist/assets/index-Dr04tUzU.css     24.53 kB │ gzip:  5.05 kB
dist/assets/supabase-B12s50R_.js  226.70 kB │ gzip: 58.90 kB
dist/assets/index-CPTy5Pvb.js     306.51 kB │ gzip: 87.38 kB
✓ built in 2.33s
```
- **Exit code:** 0 (0 errores de tipos TypeScript, 0 advertencias de compilación).

---

### Auditoría en Vivo en Navegador (Chrome DevTools en `http://localhost:5173/`)

1. **Consola de JavaScript:**
   - **Resultado:** **0 errores, 0 advertencias, 0 logs huérfanos, 0 issues de a11y**.
2. **Árbol de Accesibilidad (A11y Tree Snapshot):**
   - Landmark accesible `heading "Producción y Freezer" level="2"`.
   - Subsecciones con etiquetas explícitas y contadores contextuales: `button "Stock de Congelados (2 productos, 2 para reponer)"`, `button "Historial de Lotes (1 tandas elaboradas)"`.
   - Buscador accesible con `<label htmlFor="buscador-produccion" className="sr-only">` y atributos `id` / `name` estandarizados.
   - Diálogo modal con `role="dialog"`, `aria-modal="true"`, `aria-labelledby="titulo-modal-produccion"`.
   - Cumplimiento estricto de los 5 estados interactivos obligatorios (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`) en botones, pills, inputs y checkboxes.
   - Control preventivo de recetas: productos sin receta muestran badge "Sin receta" evitando estados inconsistentes.
3. **Prueba Transaccional en Caliente (Ciclo Completo: Elaboración y Anulación):**
   - **Ciclo 1: Anulación de Lote Previo (Restitución):**
     - Se anuló el lote previo de 10 porciones de Raviolones.
     - **Impacto:** Raviolones volvió a 0 porciones en freezer (`SIN STOCK`), Harina se restituyó de 22 a 25 kg (+3 kg) y Huevos de 78 a 98 u (+20 u).
   - **Ciclo 2: Elaboración de Nueva Tanda:**
     - Se registró una tanda de **5 porciones de Raviolones de Verdura y Ricotta**.
     - **Impacto verificado en Supabase:**
       - `productos`: Raviolones pasó a **5 porciones** (estado `REPONER`).
       - `materias_primas`: Harina 0000 Especial pasó de 25 kg a **23.5 kg** (-1.5 kg).
       - `materias_primas`: Huevos pasó de 98 u a **88 u** (-10 u).
       - `lotes_produccion`: Registro persistido con fecha `2026-10-10`, cantidad `5` y trazabilidad completa.
4. **Capturas de Pantalla Generadas:**
   - [`evidencia_produccion_freezer.png`](file:///home/tomas/lo-de-caro/evidencia_produccion_freezer.png): Stock de freezer con productos actualizados tras cocción.
   - [`evidencia_produccion_modal.png`](file:///home/tomas/lo-de-caro/evidencia_produccion_modal.png): Modal con simulador en vivo de consumo de materias primas y botones de ajuste rápido.
   - [`evidencia_produccion_historial.png`](file:///home/tomas/lo-de-caro/evidencia_produccion_historial.png): Historial cronológico de tandas con trazabilidad y acción de anular lote.

---

## 3. Reporte Técnico de Cierre: CÓMO, POR QUÉ y PARA QUÉ

### Tarea 1 & Tarea 2: Modelo de Dominio y Repositorio Supabase
- **CÓMO:** Se implementó `LoteProduccionRepositorio` con `registrarProduccion()` y `eliminarLote()` soportando el ciclo bidireccional completo: descuento/restitución de insumos y suma/resta de stock de freezer, validación contra stock negativo y rollback defensivo.
- **POR QUÉ:** La anulación de lotes debe devolver físicamente los ingredientes a la alacena y retirar los productos del freezer para evitar descuadres de inventario.
- **PARA QUÉ:** Caro puede anular tandas registradas por error sin descalibrar el stock de materias primas ni tener que corregir manualmente los kilos en la alacena.

### Tarea 3 & Tarea 4: Hook Reactivo y Componente `ListaProduccion`
- **CÓMO:** Se desacopló la vista dual mobile-first `ListaProduccion` con filtros rápidos, buscador accesible y controles con los 5 estados UI, distinguiendo platos con receta de platos pendientes.
- **POR QUÉ:** Permite consultar el estado del freezer con claridad visual sin anidamiento excesivo y operar la cocina sin fricción.
- **PARA QUÉ:** Caro sabe exactamente qué platos necesita cocinar hoy y puede disparar la tanda con un solo toque.

### Tarea 5 & Tarea 6: Modal con Simulador, 5 Estados e Integración
- **CÓMO:** Se diseñó `ModalRegistroProduccion` con simulador de insumos en vivo, cálculo en tiempo real de stock remanente, alerta visual ante insumos faltantes y confirmación consciente.
- **POR QUÉ:** Cumple las normativas de accesibilidad y 5 estados UI sin bloquear la cocina real en situaciones de emergencia.
- **PARA QUÉ:** Caro planifica la cocción sabiendo de antemano si le alcanzan los ingredientes en alacena antes de ensuciar las ollas.

---

## 4. Veredicto Formal General

```
=====================================================
               VEREDICTO SPEC-003: APROBADO
         Listo para Producción e Integración
=====================================================
```
- **Conformidad de Especificación:** 100% de requisitos cubiertos (`RF-01` a `RF-05`).
- **Pruebas Automatizadas:** 44/44 tests exitosos en Vitest (0 fallas).
- **Compilación TypeScript / Vite:** 0 errores, 0 advertencias.
- **Auditoría Chrome DevTools:** 0 errores de consola, 0 issues de a11y, árbol accesible verificado, persistencia en caliente comprobada con ciclo bidireccional de elaboración y anulación.

---

# Reporte Oficial de Verificación SDD: Ajuste Manual de Stock de Congelados (SPEC-003.1)

- **Módulo Principal:** `SPEC-003.1` (Ajuste Manual de Stock de Freezer, Salidas Operativas y Aislamiento de Materias Primas)
- **Módulo Padre:** `SPEC-003` (Producción y Control de Freezer)
- **Fecha de Auditoría:** 2026-10-10
- **Auditor:** Subagente Verificador / Auditor (@reviewer)
- **Veredicto Final:** **APROBADO (100% Verificado, Probado en Caliente y Listo para Producción)**

---

## 1. Alcance Auditado y Verificado (SPEC-003.1)

Se auditaron y validaron de punta a punta las 6 tareas atómicas de [`specs/003-produccion-stock/tasks-003.1.md`](file:///home/tomas/lo-de-caro/specs/003-produccion-stock/tasks-003.1.md):

1. **Tarea 1: Modelo de Dominio de Productos**
   - Incorporación de los tipos `MotivoAjusteStock` ('Consumo personal', 'Regalo / Degustación', 'Merma / Rotura', 'Ajuste de inventario') y `AjusteStockProductoInput` en [`src/domain/models/producto.ts`](file:///home/tomas/lo-de-caro/src/domain/models/producto.ts).

2. **Tarea 2: Método `ajustarStock` en Repositorio de Infraestructura (TDD con Vitest)**
   - Implementación de `ajustarStock(id, input)` en [`src/infrastructure/repositories/productoRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/productoRepositorio.ts).
   - Validación estricta que impide valores negativos (`nuevoStock >= 0`) y verifica motivos permitidos.
   - Aislamiento transaccional: actualiza únicamente la tabla `productos` sin tocar `materias_primas` ni `receta_ingredientes`.
   - 4 nuevas pruebas unitarias en [`tests/infrastructure/productoRepositorio.test.ts`](file:///home/tomas/lo-de-caro/tests/infrastructure/productoRepositorio.test.ts) cubriendo éxito, rechazo de negativos, rechazo de motivos inválidos y verificación de que `materias_primas` no fue invocado.

3. **Tarea 3: Extensión del Hook `useProductosRecetas`**
   - Agregada la función reactiva `ajustarStockProducto` en [`src/presentation/hooks/useProductosRecetas.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useProductosRecetas.ts) para actualizar el estado inmutable local sin necesidad de refrescar la página.

4. **Tarea 4: Componente Accesible `ModalAjusteStockProducto`**
   - Creación de [`src/presentation/components/ModalAjusteStockProducto.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalAjusteStockProducto.tsx) con:
     - Foco automático en el input numérico al abrir.
     - Soporte completo de tecla `Escape` y áreas táctiles mínimas de 44x44px.
     - Botones de ajuste rápido (-5, -1, +1, +5).
     - Cálculo interactivo de la variación de inventario ($\Delta$) con badge semafórico.
     - Selector de motivo obligatorio con 4 opciones cerradas.
     - Campo de notas/observaciones opcional.
     - Banner de advertencia visual claro que informa que el ajuste no altera materias primas.
     - Cumplimiento estricto de los 5 estados obligatorios (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`).

5. **Tarea 5: Botón "Ajustar Stock" en `ListaProduccion` e Integración en `App.tsx`**
   - Integración del botón accesible "Ajustar Stock" en cada tarjeta de producto en [`src/presentation/components/ListaProduccion.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaProduccion.tsx).
   - Coordinación de estados y renderizado del modal en [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx).

6. **Tarea 6: Verificación Integral en Caliente con DevTools y Build**
   - Auditoría en caliente con Chrome DevTools en `http://localhost:5173/`:
     - Apertura del modal, ajuste rápido con botón `-5`, carga de observación y confirmación.
     - Verificación en vivo: el stock en freezer de Raviolones pasó de 20 a 15 porciones inmediatamente.
     - Comprobación en solapa "Materias Primas": Harina (10 kg), Huevos (18 u) y Pimientos (10 kg) quedaron 100% inalterados.
     - Verificación de cierre accesible con tecla `Escape` en modal de Tallarines.
     - 0 errores de consola, árbol de accesibilidad semántico verificado.

---

## 2. Evidencias Empíricas de Calidad

### Pruebas Unitarias Automatizadas (Vitest)
```bash
$ npm test

 RUN  v3.2.7 /home/tomas/lo-de-caro

 ✓ tests/domain/calculadorCostos.test.ts (8 tests)
 ✓ tests/domain/produccionServicio.test.ts (16 tests)
 ✓ tests/infrastructure/materiaPrimaRepositorio.test.ts (11 tests)
 ✓ tests/infrastructure/productoRepositorio.test.ts (16 tests)
 ✓ tests/infrastructure/loteProduccionRepositorio.test.ts (9 tests)

 Test Files  5 passed (5)
      Tests  60 passed (60)
   Duration  1.08s
```
- **Total de pruebas:** 60 tests automatizados ejecutados y 100% aprobados (16 tests de dominio en `produccionServicio`, 16 tests de infraestructura en `productoRepositorio`).

---

### Compilación y Bundle de Producción (`tsc && vite build`)
```bash
$ npm run build

> lo-de-caro@0.1.0 build
> tsc && vite build

vite v6.4.4 building for production...
✓ 90 modules transformed.
dist/index.html                     1.21 kB │ gzip:  0.63 kB
dist/assets/index-8MUYcnRA.css     24.99 kB │ gzip:  5.13 kB
dist/assets/supabase-B12s50R_.js  226.70 kB │ gzip: 58.90 kB
dist/assets/index-qc6ebzJg.js     318.66 kB │ gzip: 89.84 kB
✓ built in 2.35s
```
- **Exit code:** 0 (0 errores de tipos TypeScript, 0 advertencias de compilación).

---

### Auditoría en Vivo en Navegador (Chrome DevTools en `http://localhost:5173/`)

1. **Consola de JavaScript:**
   - **Resultado:** **0 errores, 0 advertencias, 0 logs huérfanos**.
2. **Árbol de Accesibilidad (A11y Tree Snapshot):**
   - Botón accesible `button "Ajustar stock de freezer de Raviolones de Verdura y Ricotta"`.
   - Diálogo modal con `role="dialog"`, `aria-modal="true"`, `aria-labelledby="titulo-modal-ajuste-stock"`, `aria-describedby="descripcion-modal-ajuste-stock"`.
   - Foco cautivo automático inicial en `spinbutton "Nuevo stock físico contado: *"`.
   - Restauración automática del foco al botón activador al cerrar el modal (teclado / Escape / botón cerrar).
   - Soporte completo de tecla `Escape` y cierre por click fuera del contenedor (overlay accesible).
   - Desactivación reactiva de botones de decremento rápido (`-5`, `-1`) cuando el stock actual es 0 para evitar decrementos bajo cero.
   - Indicador visual preciso de variación de inventario ($\Delta$) con validación explícita para valores negativos ("Inválido (no puede ser negativo)").
   - Cumplimiento de los 5 estados obligatorios en cada control UI.
3. **Prueba en Caliente:**
   - **Ajuste de Raviolones de Verdura y Ricotta:** Stock ajustado de 20 a 15 porciones con motivo "Consumo personal / familiar" y nota "Almuerzo familiar domingo".
   - **Aislamiento verificado:** El stock de materias primas crudas (Harina, Huevos, Pimientos) no sufrió ninguna variación.
   - **Validación defensiva:** Verificación de rechazo de coerción a cero para valores `null`, `false` o strings vacíos.
4. **Capturas de Pantalla Generadas:**
   - [`evidencia_ajuste_stock_modal.png`](file:///home/tomas/lo-de-caro/evidencia_ajuste_stock_modal.png): Modal abierto con indicador de variación en tiempo real y botones de ajuste rápido.
   - [`evidencia_ajuste_stock_freezer.png`](file:///home/tomas/lo-de-caro/evidencia_ajuste_stock_freezer.png): Vista de freezer con stock actualizado.

---

## 3. Reporte Técnico de Cierre: CÓMO, POR QUÉ y PARA QUÉ

### Tarea 1 & Tarea 2: Modelo de Dominio y Repositorio Supabase
- **CÓMO:** Se extendieron los tipos de producto (`MotivoAjusteStock`, `AjusteStockProductoInput`), se implementó la validación pura en el dominio (`validarDatosAjusteStock` y `calcularVariacionAjusteStock` en `produccionServicio.ts`) y `ajustarStock()` en `ProductoRepositorio` con validación estricta que previene la coerción implícita de `null`/`false` a 0 en JavaScript, con aislamiento total respecto de `materias_primas`.
- **POR QUÉ:** Las comidas retiradas para consumo o mermas ya fueron elaboradas; alterar los insumos crudos provocaría un falso descuento o reposición fantasma en la alacena. Prevenir la coerción implícita evita corrupciones silenciosas del stock.
- **PARA QUÉ:** Caro mantiene la concordancia exacta entre el conteo físico de su freezer y el sistema sin descalibrar el stock de insumos ni sufrir reseteos accidentales a cero.

### Tarea 3, Tarea 4 & Tarea 5: Hook Reactivo, Modal Accesible y Lista de Producción
- **CÓMO:** Se construyó `ModalAjusteStockProducto` con botones táctiles (-5, -1, +1, +5), badge de variación en vivo, prevención de doble envío por concurrencia, restauración de foco al cerrar, selector de motivo y banner aclaratorio; se integró el botón de ajuste en `ListaProduccion` y se conectó reactivamente con el hook `useProductosRecetas`.
- **POR QUÉ:** Cumple las normativas WCAG AA, la regla de los 5 estados interactivos y optimiza el uso táctil en cocina (evitando escribir números con teclado en pantalla salvo que sea necesario).
- **PARA QUÉ:** Caro puede asentar en 2 toques que sacó una caja de ravioles para cenar sin fricción.

---

## 4. Veredicto Formal General

```
=====================================================
              VEREDICTO SPEC-003.1: APROBADO
         Listo para Producción e Integración
=====================================================
```
- **Conformidad de Especificación:** 100% de requisitos cubiertos (`RF-01` a `RF-05`).
- **Pruebas Automatizadas:** 60/60 tests exitosos en Vitest (0 fallas).
- **Compilación TypeScript / Vite:** 0 errores, 0 advertencias.
- **Auditoría Chrome DevTools:** 0 errores de consola, árbol de accesibilidad verificado, restauración de foco comprobada, persistencia en caliente probada y aislamiento de materias primas comprobado.




---

# Reporte Oficial de Verificación SDD: Ventas y Cobranzas (SPEC-004)

- **Módulo Principal:** `SPEC-004` (Catálogo de Clientes, Ventas de Mostrador, Métodos de Pago, Estados de Cobro y Descuento Atómico de Freezer)
- **Módulos Previos:** `SPEC-001` / `SPEC-001.1` (Materias Primas), `SPEC-002` (Recetas y Costeo), `SPEC-003` / `SPEC-003.1` (Producción y Stock de Congelados)
- **Fecha de Auditoría:** 2026-10-10
- **Auditor:** Subagente Verificador / Auditor (@reviewer)
- **Veredicto Final:** **APROBADO (100% Verificado y Listo para Producción)**

---

## 1. Alcance Auditado y Verificado (SPEC-004)

Se auditaron y validaron de punta a punta las 6 tareas atómicas definidas en [`specs/004-ventas-cobranzas/tasks.md`](file:///home/tomas/lo-de-caro/specs/004-ventas-cobranzas/tasks.md):

1. **Tarea 1: Modelo de Dominio y Servicios de Ventas y Cobranzas (TDD)**
   - Creación de [`src/domain/models/cliente.ts`](file:///home/tomas/lo-de-caro/src/domain/models/cliente.ts) con tipado de `Cliente`, `NuevoClienteInput`, `RegistroPagoClienteInput`.
   - Creación de [`src/domain/models/venta.ts`](file:///home/tomas/lo-de-caro/src/domain/models/venta.ts) con tipado de `EstadoCobranza` (`Cobrado`, `Pendiente`, `Regalo`), `MetodoPago` (`Efectivo`, `Transferencia`), `Venta`, `VentaItem`, `NuevaVentaInput`.
   - Implementación de [`src/domain/services/ventaServicio.ts`](file:///home/tomas/lo-de-caro/src/domain/services/ventaServicio.ts) para cálculo de subtotales, totales (con total $0 para ventas de regalo/degustación), validación de disponibilidad en freezer y métricas de mostrador.
   - 13 pruebas unitarias de dominio pasando en Vitest.

2. **Tarea 2: Repositorios de Infraestructura con Supabase (TDD)**
   - Implementación de [`src/infrastructure/repositories/clienteRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/clienteRepositorio.ts) con métodos `listar()`, `crear()`, `actualizarSaldo()` y `registrarPagoDeuda()`.
   - Implementación de [`src/infrastructure/repositories/ventaRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/ventaRepositorio.ts) con métodos `listar()`, `registrarVenta()` y `anularVenta()`.
   - Transacción atómica de múltiple impacto:
     1. Inserción de venta en `ventas`.
     2. Inserción de renglones en `venta_items`.
     3. Descuento de stock en `productos.stock_actual` para cada plato vendido.
     4. Actualización de cuenta corriente en `clientes.saldo_pendiente` si la venta es en estado `Pendiente`.
     5. Rollback defensivo integral que revierte productos y clientes ante fallos.
     6. Persistencia y mapeo seguro de `metodo_pago` garantizando compatibilidad total con la restricción `CHECK (estado_pago IN ('Pagado', 'Pendiente', 'Regalo'))` de Postgres.
   - 11 pruebas unitarias de infraestructura pasando en Vitest con mocks del cliente Supabase.

3. **Tarea 3: Hook de Aplicación `useVentasCobranzas`**
   - Creación de [`src/presentation/hooks/useVentasCobranzas.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useVentasCobranzas.ts) para orquestar la reactividad, cálculo automático de resumen financiero, manejo inmutable de clientes y ventas tras registros, cobros o anulaciones.
   - Compilación estricta y tipado estricto sin `any`.

4. **Tarea 4: Componentes de Modales Accesibles**
   - [`src/presentation/components/ModalNuevaVenta.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalNuevaVenta.tsx): selección de cliente registrado o mostrador, agregador de platos con precios reales y stock, selector de estado (`Cobrado`, `Pendiente`, `Regalo`), selector de método de pago (`Efectivo`, `Transferencia`), advertencia de stock insuficiente con confirmación explícita.
   - [`src/presentation/components/ModalNuevoCliente.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalNuevoCliente.tsx): alta rápida accesible con validación de nombre y teléfono.
   - [`src/presentation/components/ModalCobrarDeuda.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalCobrarDeuda.tsx): cobranza total o parcial de saldos adeudados con selección de método de pago y actualización inmediata.
   - Cumplimiento de los 5 estados obligatorios en cada control UI y soporte WAI-ARIA (`role="dialog"`, `aria-modal="true"`, foco cautivo y `Escape`).

5. **Tarea 5: Componente Principal `ListaVentasCobranzas` (Mobile-First y 5 Estados)**
   - Implementación de [`src/presentation/components/ListaVentasCobranzas.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaVentasCobranzas.tsx) mobile-first (375px a 420px), sin anidamiento excesivo de tarjetas (*cards sobre cards*).
   - Métricas de mostrador: Total Cobrado, Dinero en la Calle, Clientes Deudores.
   - Sub-pestañas: "Ventas Recientes" y "Clientes y Cuentas Corrientes".
   - Filtros por estado de venta y por estado de deuda de cliente.
   - Enlace directo a WhatsApp para cada cliente con teléfono.
   - Botón accesible para anular venta con confirmación modal.

6. **Tarea 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools**
   - Conexión de `ListaVentasCobranzas`, los modales y `ModalConfirmacion` en la solapa "Ventas" de [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx).
   - Sincronización reactiva del stock de freezer entre las solapas de Producción, Recetas y Ventas.
   - Auditoría en caliente en navegador real con Chrome DevTools en `http://localhost:5173/`.
   - Creación en vivo de cliente, venta a crédito con descuento de stock en freezer, cobro de deuda y anulación con restitución de stock verificadas en base de datos real.

---

## 2. Evidencias Empíricas de Calidad

### Pruebas Unitarias Automatizadas (Vitest)
```bash
$ npm test

 RUN  v3.2.7 /home/tomas/lo-de-caro

 ✓ tests/domain/calculadorCostos.test.ts (8 tests)
 ✓ tests/domain/produccionServicio.test.ts (16 tests)
 ✓ tests/domain/ventaServicio.test.ts (13 tests)
 ✓ tests/infrastructure/materiaPrimaRepositorio.test.ts (11 tests)
 ✓ tests/infrastructure/productoRepositorio.test.ts (16 tests)
 ✓ tests/infrastructure/loteProduccionRepositorio.test.ts (9 tests)
 ✓ tests/infrastructure/clienteRepositorio.test.ts (5 tests)
 ✓ tests/infrastructure/ventaRepositorio.test.ts (6 tests)

 Test Files  8 passed (8)
      Tests  84 passed (84)
   Duration  1.36s
```
- **Total de pruebas:** 84 tests automatizados ejecutados y 100% aprobados (13 tests de dominio en `ventaServicio`, 11 tests de infraestructura en repositorios de clientes y ventas).

---

### Compilación y Bundle de Producción (`tsc && vite build`)
```bash
$ npm run build

> lo-de-caro@0.1.0 build
> tsc && vite build

vite v6.4.4 building for production...
✓ 98 modules transformed.
dist/registerSW.js                  0.13 kB
dist/manifest.webmanifest           0.45 kB
dist/index.html                     1.21 kB │ gzip:  0.63 kB
dist/assets/index-BC5FE9_b.css     28.79 kB │ gzip:  5.66 kB
dist/assets/supabase-B12s50R_.js  226.70 kB │ gzip: 58.90 kB
dist/assets/index-BEjmabyD.js     367.21 kB │ gzip: 98.94 kB
✓ built in 2.54s
```
- **Exit code:** 0 (0 errores de tipos TypeScript, 0 advertencias de compilación).

---

### Auditoría en Vivo en Navegador (Chrome DevTools en `http://localhost:5173/`)

1. **Consola de JavaScript:**
   - **Resultado:** **0 errores, 0 advertencias, 0 logs huérfanos, 0 issues de accesibilidad**.
2. **Árbol de Accesibilidad (A11y Tree Snapshot):**
   - Diálogos modales con `role="dialog"`, `aria-modal="true"`, encabezados semánticos de nivel 2 y descripciones accesibles.
   - Foco cautivo automático inicial en el primer campo interactivo (`select` de cliente en nueva venta, `input` de nombre en nuevo cliente, `input` de monto en cobrar deuda).
   - Soporte completo de tecla `Escape` con cierre seguro y prevención durante guardado.
   - Etiquetas explícitas y `sr-only` asociadas a cada input y control de formulario.
   - Cumplimiento de los 5 estados obligatorios en cada control UI.
3. **Prueba Operativa en Caliente:**
   - **Alta de Cliente:** Se registró en tiempo real a "Verónica Molina" con teléfono `1144556677`.
   - **Registro de Venta:** Se cargó venta de 1 porción de "Raviolones de Verdura y Ricotta" a $8.000 en estado "Pendiente de cobro".
   - **Doble Impacto de Inventario:**
     - En la solapa "Producción", el stock del freezer de "Raviolones" se decrementó automáticamente de 15 a 14 porciones.
     - En la solapa "Ventas", la cuenta corriente de "Verónica Molina" reflejó inmediatamente "Debe $8.000", y la métrica de mostrador "En la Calle" subió a $8.000.
   - **Cobro de Cuenta Corriente:** Mediante el botón "Cobrar", se liquidó la deuda de $8.000 en Efectivo; el saldo deudor se actualizó a $0 ("Al día ($0)") y la métrica "En la Calle" retornó a $0.
   - **Anulación con Restitución:** Se probó la anulación de la venta con diálogo de confirmación accesible; el registro se eliminó y el stock en el freezer de Raviolones se restituyó de 14 a 15 porciones automáticamente.
4. **Capturas de Pantalla Generadas:**
   - [`evidencia_ventas_mostrador.png`](file:///home/tomas/lo-de-caro/evidencia_ventas_mostrador.png): Vista de mostrador con métricas, solapas de ventas/clientes y filtros.
   - [`evidencia_modal_nueva_venta.png`](file:///home/tomas/lo-de-caro/evidencia_modal_nueva_venta.png): Modal accesible de registro de venta con canasta de productos y estados de cobro.

---

## 3. Reporte Técnico de Cierre: CÓMO, POR QUÉ y PARA QUÉ

### Tarea 1 & Tarea 2: Modelo de Dominio y Repositorios Supabase
- **CÓMO:** Se modelaron las entidades `Cliente`, `Venta`, `VentaItem`, `EstadoCobranza` y `MetodoPago` en español estricto; se implementaron las funciones puras en `ventaServicio.ts` y las transacciones de múltiple impacto con rollback defensivo en `ventaRepositorio.ts` y `clienteRepositorio.ts`, respetando el check constraint de Postgres `estado_pago IN ('Pagado', 'Pendiente', 'Regalo')` y persistiendo de forma segura el método de pago (`Efectivo` / `Transferencia`).
- **POR QUÉ:** Vender una comida casera congelada debe garantizar que el stock físico del freezer se descuente en el mismo instante y que, si el cliente no paga en el momento, el saldo quede anotado en su cuenta corriente sin riesgo de descalce contable ante fallas de red.
- **PARA QUÉ:** Caro sabe exactamente qué comidas tiene listas en el freezer y cuánto dinero le debe cada vecino sin tener que llevar cuadernos paralelos.

### Tarea 3, Tarea 4 & Tarea 5: Hook Reactivo, Modales y Tablero de Mostrador
- **CÓMO:** Se implementó `useVentasCobranzas` con sincronización en memoria y los componentes `ListaVentasCobranzas`, `ModalNuevaVenta`, `ModalNuevoCliente` y `ModalCobrarDeuda`, integrando botones rápidos de WhatsApp, filtros de deudores, canasta de productos con edición de precios reales de mostrador y advertencia de stock insuficiente.
- **POR QUÉ:** Cumple los estándares WCAG AA, los 5 estados obligatorios en cada control UI, la filosofía mobile-first (375px a 420px) y la regla Ponytail de cero cards sobre cards.
- **PARA QUÉ:** En pleno despacho de cocina o mostrador, Caro puede anotar una venta en 3 toques desde su celular, enviar un WhatsApp al cliente o registrar un pago en segundos.

---

## 4. Veredicto Formal General

```
=====================================================
               VEREDICTO SPEC-004: APROBADO
          Listo para Producción e Integración
=====================================================
```
- **Conformidad de Especificación:** 100% de requisitos cubiertos (`RF-01` a `RF-06`).
- **Pruebas Automatizadas:** 84/84 tests exitosos en Vitest (0 fallas).
- **Compilación TypeScript / Vite:** 0 errores, 0 advertencias.
- **Auditoría Chrome DevTools:** 0 errores de consola, 0 issues de accesibilidad, árbol a11y verificado, persistencia en caliente probada en Supabase y sincronización bidireccional de freezer comprobada.

---

# Reporte Oficial de Verificación SDD: Gastos y Egresos Operativos (SPEC-005)

- **Módulo Principal:** `SPEC-005` (Libro Diario de Gastos, Compras de Materias Primas con Impacto en Stock/Costo, Métodos de Pago y Balance de Finanzas)
- **Módulos Previos:** `SPEC-001` (Materias Primas), `SPEC-002` (Recetas), `SPEC-003` (Producción), `SPEC-004` (Ventas y Cobranzas)
- **Fecha de Auditoría:** 2026-10-11
- **Auditor:** Subagente Verificador / Auditor (@reviewer)
- **Veredicto Final:** **APROBADO (100% Verificado y Listo para Producción)**

---

## 1. Alcance Auditado y Verificado (SPEC-005)

Se auditaron y validaron de punta a punta las 6 tareas atómicas definidas en [`specs/005-gastos-egresos/tasks.md`](file:///home/tomas/lo-de-caro/specs/005-gastos-egresos/tasks.md):

1. **Tarea 1: Modelo de Dominio y Servicios de Gastos y Egresos (TDD)**
   - Creación de [`src/domain/models/gasto.ts`](file:///home/tomas/lo-de-caro/src/domain/models/gasto.ts) con tipado estricto de `CategoriaGasto` (`'Materia Prima' | 'Packaging' | 'Servicios' | 'Equipamiento' | 'Otros'`), `MetodoPagoGasto` (`'Efectivo' | 'Transferencia'`), `DetalleCompraMateriaPrima`, `Gasto`, `NuevoGastoInput` y `ResumenGastos`.
   - Implementación de [`src/domain/services/gastoServicio.ts`](file:///home/tomas/lo-de-caro/src/domain/services/gastoServicio.ts) para cálculo de resúmenes de egresos, cálculo de nuevo costo unitario con precisión decimal, filtrado puro multicriterio y validaciones de negocio en español.
   - 17 pruebas unitarias de dominio pasando en Vitest.

2. **Tarea 2: Repositorio de Infraestructura `gastoRepositorio` con Supabase (TDD)**
   - Implementación de [`src/infrastructure/repositories/gastoRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/gastoRepositorio.ts) con métodos `listar()`, `registrarGasto()` y `eliminarGasto()`.
   - Inserción y consulta en la tabla `gastos` de Postgres respetando el constraint `CHECK (categoria IN ('Materia Prima', 'Packaging', 'Servicios', 'Equipamiento', 'Otros'))`.
   - Doble impacto atómico ante compras de materia prima: incrementa `stock_actual` y opcionalmente actualiza `costo_unitario` en la tabla `materias_primas`.
   - Rollback defensivo integral: si falla la actualización del stock del insumo, revierte inmediatamente la inserción del gasto.
   - Restitución de stock de materias primas al anular un gasto.
   - Persistencia segura y transparente de metadatos (método de pago y detalle de compra).
   - 8 pruebas unitarias de infraestructura pasando en Vitest con mocks de Supabase.

3. **Tarea 3: Hook de Aplicación `useGastos`**
   - Creación de [`src/presentation/hooks/useGastos.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useGastos.ts) para gestionar el estado de gastos, resumen financiero reactivo, estados de carga y manejo de errores.
   - Compilación estricta y tipado estricto en TypeScript sin `any`.

4. **Tarea 4: Componente Accesible `ModalNuevoGasto` (5 Estados UI)**
   - Implementación de [`src/presentation/components/ModalNuevoGasto.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalNuevoGasto.tsx) con soporte WAI-ARIA (`role="dialog"`, `aria-modal="true"`, foco en el primer input, tecla `Escape`).
   - Bloque interactivo para compras de materias primas con cálculo en vivo de nuevo costo unitario y previsualización del stock resultante.
   - Cumplimiento de los 5 estados obligatorios en cada control UI (`Default`, `Hover`, `Active`, `Focus`, `Disabled`) y zonas táctiles mínimas de 44x44px.

5. **Tarea 5: Componente Principal `ListaGastos` (Mobile-First y 5 Estados)**
   - Implementación de [`src/presentation/components/ListaGastos.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaGastos.tsx) mobile-first (375px a 420px), sin anidamiento excesivo de tarjetas (*cards sobre cards*).
   - Métricas de cabecera: Total Egresos, Materia Prima, Operativos y Fijos, y desglose Efectivo vs. Transferencia para arqueo de caja física.
   - Buscador por concepto en vivo y chips de filtrado rápido por categoría y método de pago.
   - Badges semánticos y botón accesible para anular gasto con diálogo de confirmación.

6. **Tarea 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools**
   - Conexión de `ListaGastos`, `ModalNuevoGasto` y `ModalConfirmacion` en la solapa "Gastos" de [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx).
   - Recarga reactiva bidireccional: al asentar una compra de insumos, se actualizan las solapas de Materias Primas y Recetas.
   - Actualización de la solapa "Finanzas": cruce automático de Ventas Cobradas vs. Gastos Totales, ganancia neta en tiempo real y termómetro de progreso hacia la meta mensual ($300.000).
   - Auditoría en caliente en navegador real con Chrome DevTools en `http://localhost:5173/`.

---

## 2. Evidencias Empíricas de Calidad

### Pruebas Unitarias Automatizadas (Vitest)
```bash
$ npm test

 RUN  v3.2.7 /home/tomas/lo-de-caro

 ✓ tests/domain/gastoServicio.test.ts (19 tests)
 ✓ tests/infrastructure/gastoRepositorio.test.ts (11 tests)
 ✓ tests/domain/calculadorCostos.test.ts (8 tests)
 ✓ tests/domain/produccionServicio.test.ts (16 tests)
 ✓ tests/domain/ventaServicio.test.ts (13 tests)
 ✓ tests/infrastructure/materiaPrimaRepositorio.test.ts (11 tests)
 ✓ tests/infrastructure/productoRepositorio.test.ts (16 tests)
 ✓ tests/infrastructure/loteProduccionRepositorio.test.ts (9 tests)
 ✓ tests/infrastructure/clienteRepositorio.test.ts (6 tests)
 ✓ tests/infrastructure/ventaRepositorio.test.ts (7 tests)

 Test Files  10 passed (10)
      Tests  116 passed (116)
   Duration  1.53s
```
- **Total de pruebas:** 116 tests automatizados ejecutados y 100% aprobados (0 fallas).

---

### Compilación y Bundle de Producción (`tsc && vite build`)
```bash
$ npm run build

> lo-de-caro@0.1.0 build
> tsc && vite build

vite v6.4.4 building for production...
✓ 104 modules transformed.
dist/registerSW.js                  0.13 kB
dist/manifest.webmanifest           0.45 kB
dist/index.html                     1.21 kB │ gzip:   0.63 kB
dist/assets/index-CvSVclMD.css     31.81 kB │ gzip:   6.00 kB
dist/assets/supabase-B12s50R_.js  226.70 kB │ gzip:  58.90 kB
dist/assets/index-Z98BRPck.js     402.79 kB │ gzip: 106.03 kB
✓ built in 2.57s
```
- **Exit code:** 0 (0 errores de tipos TypeScript, 0 advertencias de compilación).

---

### Auditoría en Vivo en Navegador (Chrome DevTools en `http://localhost:5173/`)

1. **Consola de JavaScript y Árbol A11y:**
   - **Resultado:** **0 errores, 0 fallos de tipos, 0 advertencias, 0 problemas de accesibilidad**.
   - Diálogos modales con `role="dialog"`, `aria-modal="true"`, foco automático en el primer campo y tecla `Escape`.
   - Etiquetas y `aria-label` asociados a todos los inputs y controles interactivos (100% libre de advertencias de campos huérfanos).
2. **Prueba Operativa y Resiliencia Multidispositivo:**
   - **Gasto Operativo:** Se registró gasto de $35.000 en categoría `Packaging` por "500 Cajas de pastas térmicas" con método `Transferencia`.
   - **Compra de Materia Prima:** Se registró compra de 25 kg de "Harina 0000 Especial" por $25.000 ($1.000/kg) en `Efectivo`.
   - **Prueba de Persistencia en Frío:** Se ejecutó `localStorage.clear()` y recarga completa de página: el sistema preservó íntegramente los métodos de pago (`Transferencia`) y el detalle de vinculación de ingredientes directamente decodificado desde la base de datos Postgres.
   - **Anulación con Restitución:** Al anular una compra, el sistema consulta atómicamente la base de datos Supabase, descuenta los kilos agregados y restituye el costo unitario anterior exactamente.
3. **Capturas de Pantalla Generadas:**
   - [`evidencia_gastos_libro_diario.png`](file:///home/tomas/lo-de-caro/evidencia_gastos_libro_diario.png): Vista principal de Gastos con métricas financieras, chips y listado.
   - [`evidencia_modal_nuevo_gasto.png`](file:///home/tomas/lo-de-caro/evidencia_modal_nuevo_gasto.png): Modal accesible con cálculo en vivo de impacto en stock y nuevo costo unitario.

---

## 3. Reporte Técnico de Cierre: CÓMO, POR QUÉ y PARA QUÉ

### Tarea 1 & Tarea 2: Modelo de Dominio y Repositorio Supabase
- **CÓMO:** Se definieron los tipos de dominio en `gasto.ts`, validaciones puras de categoría y método de pago en `gastoServicio.ts` y persistencia con rollback defensivo y metadatos embebidos en `gastoRepositorio.ts`, consultando directamente el stock real en Postgres sin depender de datos de cliente potencialmente desactualizados.
- **POR QUÉ:** Comprar insumos debe impactar en los costos y reponer el stock automáticamente sin sufrir condiciones de carrera ni perder datos de métodos de pago cuando el usuario accede desde diferentes dispositivos móviles.
- **PARA QUÉ:** Caro anota una sola vez la compra en el supermercado o distribuidora y el sistema se encarga de reponer su stock y recalcular sus costos con total fidelidad contable.

### Tarea 3, Tarea 4 & Tarea 5: Hook Reactivo, Modal y Tablero de Egresos
- **CÓMO:** Se implementó `useGastos` y los componentes `ListaGastos` y `ModalNuevoGasto` con los 5 estados obligatorios en cada control UI, autocompletado inteligente de sugerencia de compra ("Compra [insumo]") y objetivos táctiles accesibles (mínimo 44x44px).
- **POR QUÉ:** Proporciona una interfaz táctil rápida y accesible para cargar facturas o tickets desde el teléfono en el local o en el proveedor con cero fricción.
- **PARA QUÉ:** Caro puede ver al instante cuánto gastó en el mes, cuánto dinero salió de la caja en efectivo y cuánto se pagó por transferencia.

### Tarea 6: Integración Global y Balance de Finanzas
- **CÓMO:** Se conectaron los componentes en `src/App.tsx` con sincronización asíncrona estricta (`await recargarMaterias()`, `await recargarRecetas()`) y se actualizó la solapa de Finanzas con el cálculo real de Ganancia Neta ($\text{Ventas Cobradas} - \text{Gastos Totales}$) y progreso hacia la meta de retiro de $300.000.
- **POR QUÉ:** Cierra el circuito financiero de la gastronomía casera de Lo de Caro.
- **PARA QUÉ:** Caro sabe exactamente si está ganando dinero real en el mes y qué tan cerca está de su sueldo objetivo de $300.000.

---

## 4. Veredicto Formal General

```
=====================================================
               VEREDICTO SPEC-005: APROBADO
          Listo para Producción e Integración
=====================================================
```
- **Conformidad de Especificación:** 100% de requisitos cubiertos (`RF-01` a `RF-06`).
- **Pruebas Automatizadas:** 116/116 tests exitosos en Vitest (0 fallas).
- **Compilación TypeScript / Vite:** 0 errores, 0 advertencias.
- **Auditoría Chrome DevTools:** 0 errores de consola, 0 fallos de accesibilidad, persistencia multidispositivo comprobada y sincronización bidireccional con Materias Primas y Finanzas verificada.



---

# Reporte Oficial de Verificación SDD: Cierre MVP - Mejoras, Ajustes y Fixes Integrales

- **Módulo Principal:** Cierre MVP (Fix Liquidación de Cobranzas, Edición/Baja de Clientes, Gasto Fijo por Porción en Recetas, Historial de Precios en Insumos y Ajustes UI de Producción)
- **Módulos Previos:** `SPEC-001` (Materias Primas), `SPEC-002` (Recetas), `SPEC-003` (Producción), `SPEC-004` (Ventas y Cobranzas), `SPEC-005` (Gastos y Finanzas)
- **Fecha de Auditoría:** 2026-10-12
- **Auditor:** Subagente Verificador / Auditor (@reviewer)
- **Veredicto Final:** **APROBADO (100% Verificado, Probado en Caliente y Listo para Producción)**

---

## 1. Alcance Auditado y Verificado

Se auditaron y validaron de punta a punta las 5 tareas de mejora e integración para el cierre del MVP:

1. **Tarea 1: Corrección de Liquidación de Ventas Pendientes en Pagos Parciales y Cuotas**
   - Actualización de `saldarVentasPendientes` en [`src/infrastructure/repositories/ventaRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/ventaRepositorio.ts) para recibir el saldo actual del cliente o consultarlo en Supabase si no se provee.
   - Si el saldo deudor remanente es $0, liquida y marca inmediatamente todas las ventas pendientes del cliente como pagadas (`Cobrado`).
   - Si el saldo es mayor a $0 (pago parcial o entrega en cuotas), calcula el monto total amortizado acumulado (`totalDeudaVentas - saldoCliente`) y cancela cronológicamente las ventas cuyo monto acumulado haya sido cubierto.
   - Sincronización inmediata en el hook [`src/presentation/hooks/useVentasCobranzas.ts`](file:///home/tomas/lo-de-caro/src/presentation/hooks/useVentasCobranzas.ts) al registrar pagos de deuda.
   - Registro de causa raíz, solución técnica y regla de prevención en [`docs/contexto/errores-conocidos.md`](file:///home/tomas/lo-de-caro/docs/contexto/errores-conocidos.md).
   - 2 nuevas pruebas unitarias en [`tests/infrastructure/ventaRepositorio.test.ts`](file:///home/tomas/lo-de-caro/tests/infrastructure/ventaRepositorio.test.ts) (9/9 tests pasando).

2. **Tarea 2: Edición y Eliminación de Clientes con Advertencia de Deuda Pendiente**
   - Implementación de métodos `actualizar(id, input)` y `eliminar(id)` en [`src/infrastructure/repositories/clienteRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/clienteRepositorio.ts) con validación estricta de nombre no vacío.
   - Creación del componente accesible [`src/presentation/components/ModalEditarCliente.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalEditarCliente.tsx) con los 5 estados obligatorios (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`) y badge de saldo actual.
   - Integración de botones "Editar" y "Eliminar" en las tarjetas de cliente de [`src/presentation/components/ListaVentasCobranzas.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaVentasCobranzas.tsx).
   - Integración con `ModalConfirmacion` en [`src/App.tsx`](file:///home/tomas/lo-de-caro/src/App.tsx) alertando explícitamente cuando el cliente posee saldo pendiente antes de borrarlo.
   - 4 nuevas pruebas unitarias en [`tests/infrastructure/clienteRepositorio.test.ts`](file:///home/tomas/lo-de-caro/tests/infrastructure/clienteRepositorio.test.ts) (10/10 tests pasando).

3. **Tarea 3: Gasto Fijo por Porción Configurable en Recetas y Márgenes**
   - Extensión de `calcularCostoReceta(ingredientes, gastoFijoPorcion = 0)` y `clasificarMargen()` en [`src/domain/services/calculadorCostos.ts`](file:///home/tomas/lo-de-caro/src/domain/services/calculadorCostos.ts) sumando el costo fijo al costo unitario total de elaboración.
   - Creación del repositorio [`src/infrastructure/repositories/configuracionRepositorio.ts`](file:///home/tomas/lo-de-caro/src/infrastructure/repositories/configuracionRepositorio.ts) con persistencia local resiliente (`localStorage` con fallback seguro).
   - Creación del modal accesible [`src/presentation/components/ModalConfiguracionGastoFijo.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalConfiguracionGastoFijo.tsx) con validación numérica y 5 estados UI.
   - Banner/chip informativo en [`src/presentation/components/ListaRecetas.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaRecetas.tsx) con botón "Configurar", indicador de gasto fijo en cada tarjeta y desglose de costo fijo en la fórmula expandida.
   - Soporte en [`src/presentation/components/ModalReceta.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ModalReceta.tsx) para previsualizar costo y margen en vivo incluyendo el gasto fijo por porción.
   - 2 nuevas pruebas unitarias en [`tests/domain/calculadorCostos.test.ts`](file:///home/tomas/lo-de-caro/tests/domain/calculadorCostos.test.ts) (10/10 tests pasando).

4. **Tarea 4: Historial de Precios y Variación en Materias Primas a Partir de Compras**
   - Integración de prop opcional `gastos` en [`src/presentation/components/ListaMateriasPrimas.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaMateriasPrimas.tsx).
   - Filtro reactivo de compras asociadas al insumo por `id` o por nombre dentro de la categoría `Materia Prima`.
   - Acordeón accesible desplegable "▶ Ver Historial de Precios (N compras)" con orden cronológico ascendente/descendente.
   - Cálculo automático del costo unitario histórico de cada compra, cantidad adquirida, monto total y cálculo de variación porcentual respecto de la primera compra registrada (Base, incremento o descuento).

5. **Tarea 5: Ajustes de Nomenclatura en Producción**
   - En [`src/presentation/components/ListaProduccion.tsx`](file:///home/tomas/lo-de-caro/src/presentation/components/ListaProduccion.tsx), actualización del botón y etiqueta de sub-pestaña de "Historial de Lotes" a **"Historial de Producción"**.
   - Actualización de los botones de acción rápida de "+ Cocinar" a **"Agregar"**, estandarizando la acción de registrar tandas elaboradas.

---

## 2. Evidencias Empíricas de Calidad

### Pruebas Unitarias Automatizadas (Vitest)
```bash
$ npm test

 RUN  v3.2.7 /home/tomas/lo-de-caro

 ✓ tests/domain/gastoServicio.test.ts (19 tests)
 ✓ tests/domain/produccionServicio.test.ts (16 tests)
 ✓ tests/infrastructure/materiaPrimaRepositorio.test.ts (11 tests)
 ✓ tests/infrastructure/clienteRepositorio.test.ts (10 tests)
 ✓ tests/infrastructure/gastoRepositorio.test.ts (11 tests)
 ✓ tests/infrastructure/productoRepositorio.test.ts (16 tests)
 ✓ tests/infrastructure/loteProduccionRepositorio.test.ts (9 tests)
 ✓ tests/domain/ventaServicio.test.ts (13 tests)
 ✓ tests/domain/calculadorCostos.test.ts (10 tests)
 ✓ tests/infrastructure/configuracionRepositorio.test.ts (5 tests)
 ✓ tests/infrastructure/ventaRepositorio.test.ts (10 tests)

 Test Files  11 passed (11)
      Tests  130 passed (130)
   Duration  1.60s
```
- **Total de pruebas:** 130 tests unitarios automatizados ejecutados y 100% aprobados (0 fallas).

---

### Compilación y Bundle de Producción (`tsc && vite build`)
```bash
$ npm run build

> lo-de-caro@0.1.0 build
> tsc && vite build

vite v6.4.4 building for production...
✓ 107 modules transformed.
dist/registerSW.js                  0.13 kB
dist/manifest.webmanifest           0.45 kB
dist/index.html                     1.21 kB │ gzip:   0.63 kB
dist/assets/index-DXY7ceu8.css     32.18 kB │ gzip:   6.05 kB
dist/assets/supabase-B12s50R_.js  226.70 kB │ gzip:  58.90 kB
dist/assets/index-BMxou0_j.js     419.27 kB │ gzip: 108.96 kB
✓ built in 3.06s

PWA v0.21.2
mode      generateSW
precache  9 entries (663.57 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```
- **Exit code:** 0 (0 errores de tipos TypeScript, 0 advertencias de compilación).

---

### Auditoría en Vivo en Navegador (Chrome DevTools en `http://localhost:5173/`)

1. **Consola de JavaScript:**
   - **Resultado:** **0 errores, 0 advertencias, 0 logs huérfanos**.
2. **Árbol de Accesibilidad (A11y Tree):**
   - Modal de Edición de Cliente con roles WAI-ARIA, foco inicial y soporte completo de `Escape`.
   - Modal de Gasto Fijo con `spinbutton` accesible, validación visual y semántica.
   - Acordeón de Historial de Precios con `aria-expanded` y botón interactivo operable por teclado.
   - Pestaña "Historial de Producción" y botones "Agregar" con nombres accesibles válidos.
   - Cumplimiento de los 5 estados obligatorios (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`) en todos los nuevos componentes.
3. **Prueba Operativa en Caliente:**
   - **Historial de Precios:** Despliegue de acordeón en Harina 0000 Especial mostrando compras históricas, precio unitario y badges de variación porcentual.
   - **Gasto Fijo por Porción:** Configuración en vivo de $500/porción; se observó la reactividad inmediata recalculando el costo y margen de todos los platos en `ListaRecetas`.
   - **Nomenclatura Producción:** Navegación a solapa Producción confirmando "Historial de Producción" y botón "Agregar".
   - **Edición y Baja de Clientes:** Verificación de apertura de `ModalEditarCliente` con datos pre-cargados y modal de confirmación ante eliminación.

---

## 3. Reporte Técnico de Cierre: CÓMO, POR QUÉ y PARA QUÉ

### Tarea 1: Fix Liquidación de Ventas Pendientes ante Pagos Parciales en Cuotas
- **CÓMO:** Se modificó `saldarVentasPendientes` en `ventaRepositorio.ts` para que, cuando el saldo pendiente remanente llegue a $0, liquide incondicionalmente todas las ventas pendientes; si el saldo es parcial, suma la deuda total histórica de ventas y liquida cronológicamente las ventas cubiertas por el total acumulado abonado (`totalDeuda - saldoRestante`). Se documentó en `errores-conocidos.md`.
- **POR QUÉ:** Antes, la función requería que el monto del pago puntual igualara exactamente el total de una venta individual, dejando ventas en estado `Pendiente` a pesar de que el cliente ya había terminado de pagar en varias cuotas.
- **PARA QUÉ:** Caro puede aceptar pagos en cuotas o adelantos parciales de sus clientes sin que el sistema siga mostrando ventas viejas como impagas.

### Tarea 2: Edición y Eliminación de Clientes con Advertencia de Deuda
- **CÓMO:** Se incorporaron los métodos `actualizar` y `eliminar` en `clienteRepositorio.ts`, se creó `ModalEditarCliente` cumpliendo los 5 estados UI y accesibilidad, y se integró un diálogo de confirmación con alerta visible y texto explicativo si el cliente posee saldo pendiente antes de borrarlo.
- **POR QUÉ:** Los clientes cambian de teléfono o tienen errores tipográficos en el nombre, y dar de baja un cliente debe advertir si hay dinero sin cobrar para evitar pérdidas financieras involuntarias.
- **PARA QUÉ:** Caro puede mantener su libreta de clientes ordenada, corregir contactos y evitar borrar por error a clientes que aún le deben plata.

### Tarea 3: Gasto Fijo por Porción Configurable en Recetas y Márgenes
- **CÓMO:** Se extendió el servicio de dominio `calculadorCostos.ts` incorporando `gastoFijoPorcion` en la suma del costo y en la clasificación del margen; se implementó `configuracionRepositorio.ts` con persistencia en `localStorage`, y se crearon el banner y modal `ModalConfiguracionGastoFijo` en `ListaRecetas` y `ModalReceta`.
- **POR QUÉ:** El costo de una porción de pasta no es solo la harina y el huevo; el gas, la electricidad, el packaging y el alquiler impactan directamente en el costo unitario real.
- **PARA QUÉ:** Caro puede calcular el costo real integral de sus platos y fijar precios de venta que realmente cubran sus costos fijos y le dejen ganancia limpia.

### Tarea 4: Historial de Precios y Variación Porcentual en Materias Primas
- **CÓMO:** Se conectaron los `gastos` con `ListaMateriasPrimas`, filtrando las compras asociadas a cada insumo crudo, ordenándolas cronológicamente y calculando la variación porcentual entre la primera compra base y las siguientes compras, presentándolo en un acordeón accesible.
- **POR QUÉ:** En contextos inflacionarios, el costo de las materias primas fluctúa permanentemente; visibilizar el historial permite entender cómo varió el precio de compra en el tiempo.
- **PARA QUÉ:** Caro puede detectar de un vistazo aumentos en sus proveedores para decidir cuándo renegociar o ajustar los precios de sus platos.

### Tarea 5: Ajustes de Nomenclatura en Producción
- **CÓMO:** Se renombró la solapa de lotes a "Historial de Producción" y el botón de acción rápida de "+ Cocinar" a "Agregar" en `ListaProduccion.tsx`.
- **POR QUÉ:** El término "cocinar" resultaba informal y ambiguo frente a la acción real de registrar tandas elaboradas en el sistema, y "producción" unifica el lenguaje con el resto del módulo.
- **PARA QUÉ:** Caro y su equipo encuentran una interfaz clara, consistente y profesional que refleja exactamente la operativa del taller gastronómico.

---

## 4. Veredicto Formal General

```
=====================================================
            VEREDICTO CIERRE MVP: APROBADO
         100% Verificado y Listo para Producción
=====================================================
```
- **Conformidad de Requisitos:** 100% de tareas completadas y verificadas.
- **Pruebas Automatizadas:** 130/130 tests exitosos en Vitest (0 fallas).
- **Compilación TypeScript / Vite:** 0 errores, 0 advertencias (exit code 0).
- **Auditoría Chrome DevTools:** 0 errores de consola, árbol de accesibilidad semántico verificado, 5 estados UI cumplidos en todos los componentes interactivos.

---

# Reporte Oficial de Verificación: Módulo Finanzas Mensuales y Mejoras MVP

- **Módulos Auditados:** Módulo Finanzas (Balance Mensual, Metas Dinámicas, Top Productos, Desglose Gastos) + Módulo Producción (Renombrado de botón).
- **Fecha de Auditoría:** 2026-10-12
- **Auditor:** Subagente de Corrección y Verificación Escéptica / Antigravity
- **Veredicto:** **APROBADO (153/153 Tests en Vitest, Compilación limpia y Auditoría DevTools en Caliente OK)**

## 1. Alcance y Tareas Implementadas

1. **Filtro y Selector de Período Mensual en Finanzas:**
   - Selección por mes individual (`YYYY-MM`) con mes actual seleccionado por defecto, últimos 6 meses pre-cargados para auditoría histórica, y opción `Histórico Completo`.
   - Soporte para 5 estados UI en el `<select>` (Default, Hover, Active, Focus :focus-visible, Disabled).
   - Recálculo reactivo automático de ingresos cobrados, ventas pendientes/fiadas por cobrar, gastos totales, ganancia neta real, margen global, ticket promedio y cantidad de operaciones.
2. **Meta de Retiro Mensual Totalmente Editable:**
   - Extensión de `ConfiguracionRepositorio` con `obtenerMetaMensual` y `guardarMetaMensual` persistiendo en `localStorage` por mes específico o default, con blindaje contra datos corruptos, arrays y `NaN`.
   - `ModalEditarMetaMensual` accesible (WAI-ARIA `dialog`, tecla `Escape`, trampa de foco `Tab`/`Shift+Tab` bidireccional, restauración de foco al elemento invocador, presets de atajo rápido, validación estricta y opción de guardar como base para meses futuros).
   - Barra de progreso que refleja el cumplimiento contra la ganancia neta y calcula el monto exacto faltante, con textos contextualmente adaptados según el período ("Meta de Retiro Personal de Caro" vs "Meta Mensual de Referencia").
3. **Resúmenes Enriquecidos y Top Productos Más Vendidos:**
   - Creación de `src/domain/services/finanzaServicio.ts` y modelo `src/domain/models/finanza.ts`.
   - Ranking por unidades elaboradas vendidas y facturación real a partir de `venta.items`, con exclusión de ingresos ficticios en ventas bonificadas (`Regalo`) y destaque prominente con insignia `🏆 Más Vendido` para el producto estrella.
   - Desglose de gastos por rubro con porcentaje relativo sobre el egreso total.
   - Cálculo del ticket promedio sobre ventas cobradas.
   - Métrica de ventas pendientes/fiadas acumuladas del período para control de caja completo.
4. **Renombrado de Botón en Producción:**
   - En `ListaProduccion.tsx`, cambio del texto "+ Cocinar Lote" por "Agregar" (con preservación de `aria-label` y 5 estados UI).

## 2. Evidencias de Verificación

- **Pruebas Automatizadas (Vitest):**
  - 153/153 tests pasando (17 tests en `finanzaServicio` y 11 tests en `ConfiguracionRepositorio`).
  - Cobertura de edge cases: ventas bonificadas de regalo en top productos, ventas pendientes en resumen consolidado, meses configurados/adicionales, y tolerancia a valores `NaN` o estructuras corruptas en `localStorage`.
- **Compilación y Build (`tsc && vite build`):**
  - Exit code 0, 0 errores, 0 advertencias (`dist/` generado limpiamente).
- **Auditoría en Caliente (Chrome DevTools en `http://localhost:5173/`):**
  - Consola limpia (0 errores, 0 advertencias).
  - Árbol de accesibilidad WAI-ARIA validado: `combobox`, `dialog modal`, `spinbutton` con `min="0"` y `step="1000"` válido.
  - Trampa y restauración de foco verificada en vivo tras modificar objetivo mensual.
  - Navegación reactiva entre períodos (mes corriente, meses anteriores e Histórico Completo) comprobada en caliente.

