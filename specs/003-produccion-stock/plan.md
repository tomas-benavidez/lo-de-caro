# Plan Técnico de Arquitectura: Módulo de Producción y Stock de Congelados

- **Identificador:** `PLAN-003`
- **Módulo:** Producción y Stock de Congelados (SPEC-003)
- **Enfoque:** Arquitectura Limpia + Ponytail (YAGNI, Simplicidad Extrema, Cero Bloat, Transaccionalidad Segura)

---

## 1. Diseño Arquitectónico por Capas

```
[ UI React Mobile-First: ListaProduccion / ModalRegistroProduccion ]
                              │
                              ▼
                  [ Hook: useProduccion ] ──► (Application Layer)
                              │
                              ▼
            [ Repositorio: loteProduccionRepositorio ] ──► (Infrastructure Layer)
                              │
                              ▼
      [ Supabase PostgreSQL: lotes_produccion, productos, materias_primas ]
```

### A. Capa de Dominio (`src/domain/`)
1. **Modelos:**
   - [`src/domain/models/loteProduccion.ts`](file:///home/tomas/lo-de-caro/src/domain/models/loteProduccion.ts):
     - `LoteProduccion`: Entidad que representa una tanda elaborada (`id`, `fecha`, `productoId`, `nombreProducto`, `unidadVenta`, `cantidadElaborada`, `observaciones`, `createdAt`).
     - `ItemConsumoIngrediente`: Estructura para previsualizar insumos consumidos (`materiaPrimaId`, `nombreMateriaPrima`, `cantidadConsumida`, `unidadMedida`, `stockActual`, `stockRemanente`, `insuficiente`).
     - `EstadoStockCongelado`: 'SIN_STOCK' | 'REPONER' | 'SALUDABLE'.
2. **Servicios de Dominio:**
   - [`src/domain/services/produccionServicio.ts`](file:///home/tomas/lo-de-caro/src/domain/services/produccionServicio.ts):
     - `calcularConsumoInsumos(recetaIngredientes, cantidadElaborada, materiasPrimas)`: Calcula consumo exacto y detecta insumos insuficientes o faltantes.
     - `clasificarStockCongelado(stockActual, stockMinimo)`: Evalúa el estado del freezer para cada producto.

### B. Capa de Infraestructura (`src/infrastructure/`)
1. **Archivo:** `src/infrastructure/repositories/loteProduccionRepositorio.ts`.
2. **Consultas y Mapeadores:**
   - `listarLotes()`: Trae lotes ordenados por fecha y creación descendente con join a `productos(id, nombre, categoria, unidad_venta)`.
   - `registrarLote(input, ingredientes)`:
     - Realiza el triple impacto de forma secuencial y segura:
       1. Inserta fila en `lotes_produccion`.
       2. Incrementa `stock_actual` en `productos`.
       3. Descuenta `stock_actual` en `materias_primas` para cada ingrediente.
       4. Si ocurre cualquier fallo, realiza rollback inverso (descuenta producto, restituye materias primas, borra lote) y lanza error informativo.
   - `eliminarLote(id)`: Permite anular un lote, restituyendo insumos y descontando producto elaborado.

### C. Capa de Aplicación (`src/presentation/hooks/`)
1. **Hook `useProduccion`:**
   - Gestiona estado de lotes elaborados, productos activos y materias primas.
   - Provee métodos `registrarProduccion`, `eliminarLote`, `recargar`, `cargando`, `error`.
   - Sincroniza el estado local de forma inmutable para actualización instantánea sin recarga.

### D. Capa de Presentación (`src/presentation/components/`)
1. **`ListaProduccion.tsx`:**
   - Sección superior: "Stock de Congelados" con tarjetas mobile-first mostrando unidades en freezer, umbral mínimo y semáforo de alerta.
   - Botón de acción principal: "+ Cocinar Lote" con los 5 estados obligatorios.
   - Sección inferior: "Historial de Lotes Elaborados" con fecha, plato, cantidad cocinada, observaciones y botón de eliminar lote con confirmación modal.
2. **`ModalRegistroProduccion.tsx`:**
   - Formulario accesible con `role="dialog"`, `aria-modal="true"`, foco en selector y cierre con `Escape`.
   - Selector de producto filtrando los que tienen receta cargada.
   - Input de cantidad elaborada con botones rápidos (+1, +5, +10) o tipeo libre.
   - Input de fecha y campo de notas.
   - Simulador en vivo de consumo de materias primas con alertas si el stock es bajo o insuficiente.
   - Todos los controles cumplen los 5 estados interactivos obligatorios (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`).
3. **Integración en `src/App.tsx`:**
   - Reemplaza el marcador temporal de la solapa "Producción".
   - Conecta el registro de lotes de modo que al cocinar, se refresquen también las solapas de Materias Primas y Recetas para consistencia total en toda la app.

---

## 2. Estrategia de Pruebas (TDD con Vitest)
1. Pruebas unitarias de servicios de dominio: cálculo de consumos, redondeos de insumos, clasificación de stock de congelados.
2. Pruebas unitarias de infraestructura con mocks del cliente Supabase: inserción, rollback defensivo, mapeo de lotes con join.
3. Pruebas de compilación TypeScript estricta y bundle de producción con Vite.
