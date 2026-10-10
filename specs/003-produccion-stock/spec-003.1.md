# Especificación Funcional y Técnica: Ajuste Manual de Stock de Congelados en Producción

- **Identificador:** `SPEC-003.1`
- **Módulo:** Producción y Stock de Congelados
- **Estado:** Listo para Implementación
- **Depende de:** `SPEC-003` (Registro de Lotes de Producción y Control de Freezer)

---

## 1. Objetivo y Contexto de Negocio

En la operatoria culinaria cotidiana de Caro, los productos congelados almacenados en el freezer no sólo disminuyen por ventas comerciales a clientes, sino también por eventos propios del negocio gastronómico:
1. **Consumo Personal / Familiar:** Almuerzos o cenas de Caro o su familia donde se retira comida lista del freezer.
2. **Regalos o Degustaciones:** Obsequios a clientes fieles o muestras para degustaciones promocionales.
3. **Mermas, Roturas o Descarte:** Cajas que se abrieron, productos dañados por manipulación en freezer o fecha vencida.
4. **Ajuste de Inventario / Conteo Físico:** Recuento visual de control semanal o mensual que corrige discrepancias entre el número digital y la cantidad física real.

### Regla Crucial de Negocio:
A diferencia del registro de una tanda de cocción (donde se consumen materias primas) o de la anulación de un lote (donde se devuelven materias primas), **el ajuste manual de stock de congelados no debe alterar ninguna materia prima de la alacena**. Los insumos crudos ya fueron consumidos cuando el plato se cocinó inicialmente. El ajuste afecta exclusivamente el inventario de productos terminados en la tabla `productos`.

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Disparador de Ajuste Manual en la UI
* **Event-driven:** En la sub-solapa "Stock de Congelados" del componente `ListaProduccion`, cada tarjeta de producto debe incluir un botón interactivo "Ajustar Stock" accesible y operable táctilmente.
* **Criterio:** El botón debe contar con etiqueta semántica clara (`aria-label="Ajustar stock de freezer de [Nombre del Producto]"`) y cumplir con los 5 estados obligatorios de UI (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`).

### RF-02: Diálogo Modal de Ajuste de Stock
* **Event-driven:** Al pulsar "Ajustar Stock", se despliega el modal `ModalAjusteStockProducto` enfocado inicialmente en el input numérico.
* **Criterio:** El modal debe exhibir:
  1. Nombre del producto, categoría y unidad de venta.
  2. Stock actual en freezer (ej. `12 Porciones`).
  3. Campo de entrada para definir el **Nuevo stock físico** (valor numérico $\ge 0$).
  4. Indicador visual en tiempo real de la diferencia ($\Delta = \text{nuevoStock} - \text{stockActual}$), indicando si es disminución (ej. `-2`), aumento (ej. `+3`) o sin cambios (`0`).
  5. Selector de motivo obligatorio con 4 opciones cerradas:
     - `Consumo personal`
     - `Regalo / Degustación`
     - `Merma / Rotura`
     - `Ajuste de inventario`
  6. Campo opcional para observaciones / notas adicionales.
  7. **Aviso explícito de no alteración de materias primas:** Banner de texto visible y de alto contraste que recuerde: *"Este ajuste actualiza exclusivamente el stock de freezer. NO modifica ni consume materias primas de la alacena."*

### RF-03: Restricción contra Stock Negativo
* **Unwanted behavior:** El sistema debe impedir asignar un stock físico negativo. Si el usuario ingresa un número menor a cero o un valor no numérico, el formulario debe mostrar un mensaje de error accesible y deshabilitar el botón de confirmación.

### RF-04: Persistencia y Aislamiento de Materias Primas
* **Ubiquitous:** Al confirmar el ajuste, se ejecuta el método `ajustarStock` de `ProductoRepositorio`, actualizando `stock_actual` en `productos`. Las tablas `materias_primas`, `receta_ingredientes` y `lotes_produccion` quedan estrictamente inalteradas.

### RF-05: Reactividad Inmediata en la UI
* **Ubiquitous:** Al completarse el ajuste, la lista de productos y los badges de semáforo (`SIN STOCK`, `REPONER`, `STOCK OK`) se actualizan inmediatamente sin requerir recargar la página.

---

## 3. Especificación Técnica y Arquitectura

### A. Capa de Dominio (`src/domain/models/producto.ts`)
```typescript
export type MotivoAjusteStock =
  | 'Consumo personal'
  | 'Regalo / Degustación'
  | 'Merma / Rotura'
  | 'Ajuste de inventario';

export interface AjusteStockProductoInput {
  nuevoStock: number;
  motivo: MotivoAjusteStock;
  observaciones?: string;
}
```

### B. Capa de Infraestructura (`src/infrastructure/repositories/productoRepositorio.ts`)
```typescript
async ajustarStock(id: string, input: AjusteStockProductoInput): Promise<Producto>
```
Valida que `nuevoStock >= 0` y actualiza `stock_actual` en Supabase (`productos`).

### C. Capa de Aplicación (`src/presentation/hooks/useProductosRecetas.ts`)
Función `ajustarStockProducto(id: string, input: AjusteStockProductoInput): Promise<Producto>`. Actualiza el estado inmutable de `productos`.

### D. Capa de Presentación
- `src/presentation/components/ModalAjusteStockProducto.tsx`: Diálogo modal accesible.
- `src/presentation/components/ListaProduccion.tsx`: Botón "Ajustar Stock" en cada tarjeta.
- `src/App.tsx`: Coordinación del estado y apertura/cierre del modal.

---

## 4. Criterios de Aceptación (DoD)

1. **Persistencia:** Modificar el stock de un producto actualiza el valor en Supabase y no toca materias primas.
2. **Validación:** Se rechazan valores de stock inferiores a cero.
3. **Accesibilidad y 5 Estados:** Diálogo con `role="dialog"`, `aria-modal="true"`, foco cautivo, soporte de tecla `Escape`, y controles con los 5 estados interactivos obligatorios.
4. **Tests Unitarios:** Suite de pruebas en Vitest verificando `ajustarStock` en éxito, rechazo de negativos y aislamiento de insumos.
5. **Auditoría DevTools:** 0 errores en consola del navegador, árbol de accesibilidad semántico verificado.
