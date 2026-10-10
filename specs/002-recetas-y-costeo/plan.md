# Plan Técnico de Arquitectura: Módulo de Recetas y Costeo

- **Identificador:** `PLAN-002`
- **Módulo:** Recetas y Costeo (SPEC-002)
- **Enfoque:** Arquitectura Limpia + Ponytail (YAGNI, Simplicidad Extrema, Cero Bloat)

---

## 1. Diseño por Capas

```
[ UI React Mobile-First: ListaRecetas / ModalReceta ]
                         │
                         ▼
             [ Hook: useProductosRecetas ] ──► (Application Layer)
                         │
                         ▼
        [ Repositorio: productoRepositorio ] ──► (Infrastructure Layer)
                         │
                         ▼
 [ Supabase PostgreSQL (productos + receta_ingredientes) ] ──► (Database)
```

### Capa de Dominio (`src/domain/`)
1. **Modelos:**
   - [`src/domain/models/producto.ts`](file:///home/tomas/lo-de-caro/src/domain/models/producto.ts): Asegurar que `RecetaIngredienteItem.unidadMedida` soporte `UnidadMedida` ('g' | 'ml' | 'u' | 'kg' | 'l').
2. **Servicios de Dominio:**
   - [`src/domain/services/calculadorCostos.ts`](file:///home/tomas/lo-de-caro/src/domain/services/calculadorCostos.ts): Reutiliza `calcularCostoReceta()` y `calcularMargenGanancia()`.
   - Incorporar función de clasificación visual de margen (`clasificarMargen()`).

### Capa de Infraestructura (`src/infrastructure/`)
1. **Archivo:** `src/infrastructure/repositories/productoRepositorio.ts`.
2. **Mapeo Relacional:**
   - Consultas con Join PostgREST: `.select('*, receta_ingredientes(*, materias_primas(*))')`.
   - Mapeo de filas anidadas a la entidad `Producto` con `ingredientes: RecetaIngredienteItem[]`.
3. **Persistencia Atómica / Transaccional:**
   - Método `listar()`: Productos activos con recetas completas.
   - Método `crear(producto, ingredientes)`: Inserta en `productos`, luego en `receta_ingredientes`.
   - Método `actualizar(id, producto, ingredientes)`: Actualiza producto, sincroniza `receta_ingredientes`.
   - Método `eliminar(id)`: Borra el producto (cascada automática a ingredientes).

### Capa de Aplicación (`src/presentation/hooks/`)
1. **Hook `useProductosRecetas`:**
   - Orquesta la carga de productos con sus recetas.
   - Integra la lista de materias primas para poblar los selectores del formulario de recetas.
   - Expone métodos `crearProductoReceta`, `actualizarProductoReceta`, `eliminarProductoReceta`, `recargar`.

### Capa de Presentación (`src/presentation/components/`)
1. **`ListaRecetas.tsx`:**
   - Vista móvil compacta de productos con precios, costos calculados y margen en $ y %.
   - Detalle expandible de ingredientes por producto (cero cards anidadas, diseño en tabla/lista limpia).
   - Acciones de Editar y Eliminar con áreas de toque táctiles (44x44px).
2. **`ModalReceta.tsx`:**
   - Formulario modal adaptable (alta y edición).
   - Selector dinámico de insumos con control de cantidades y totalizador en vivo.
   - Implementación estricta de 5 estados en cada control (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`).
3. **Integración en `App.tsx`:**
   - Activación de la solapa "Recetas" conectada con datos en vivo.

---

## 2. Estrategia de Pruebas (TDD con Vitest)
1. **Pruebas de Repositorio y Mapeadores:**
   - Mapeo bidireccional entre datos de Postgres y entidades de dominio.
   - Sincronización correcta de ingredientes en inserción y actualización.
2. **Pruebas de Servicios de Costos:**
   - Verificación de fórmulas de margen y casos de borde (división por cero, costo mayor que precio, ingredientes vacíos).
3. **Pruebas de Compilación y Calidad:**
   - TypeScript estricto (`tsc --noEmit`).
   - Build de producción con Vite (`npm run build`).
