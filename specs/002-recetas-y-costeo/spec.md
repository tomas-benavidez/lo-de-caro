# Especificación Funcional: Módulo de Recetas y Costeo

- **Identificador:** `SPEC-002`
- **Módulo:** Recetas y Costeo de Productos
- **Estado:** Listo para Implementación
- **Depende de:** `SPEC-001` / `SPEC-001.1` (Materias Primas e Insumos)

---

## 1. Objetivo y Contexto de Negocio

En el negocio de comidas caseras congeladas de Caro, el mayor desafío financiero y operativo es estandarizar las porciones y conocer el **costo exacto de elaboración** de cada producto terminado (cajas de ravioles, docenas de empanadas, tartas familiares, porciones de pasta).

Sin recetas estandarizadas:
1. No se puede calcular el margen de ganancia real por porción frente a la inflación de materias primas.
2. No se puede alimentar el módulo de producción (SPEC-003), que descontará insumos de alacena y sumará producto al freezer.
3. El precio de lista se fija por intuición y no por números reales de costo.

Este módulo permite a Caro:
- Crear y gestionar productos de venta catalogados por categoría y unidad de venta.
- Asociar los ingredientes necesarios para elaborar 1 unidad de venta con sus cantidades exactas.
- Calcular automáticamente el costo de producción total y el margen de ganancia (en pesos y porcentaje) en tiempo real.
- Visualizar alertas inmediatas si el margen de un producto es negativo o riesgoso.

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Catálogo de Productos y Recetas
* **Ubiquitous:** El sistema debe listar todos los productos activos clasificados por categoría (`Pastas Rellenas`, `Pastas Lisas`, `Empanadas`, `Tartas`, `Salsas`) y unidad de venta (`Porcion`, `Docena`, `Kilo`, `Unidad`).
* **Criterio:** Cada producto debe mostrar:
  - Nombre y Categoría.
  - Precio de Lista de venta al público.
  - Costo de Producción calculado $\sum (\text{cantidad} \times \text{costoUnitario})$.
  - Margen de Ganancia en pesos ($) y porcentaje (%).
  - Cantidad de ingredientes que componen la receta, con opción de expandir/ver el desglose detallado.

### RF-02: Cálculo Automático en Tiempo Real de Costos y Márgenes
* **Ubiquitous:** Con cada variación de precio de lista o cambio de ingredientes/cantidades, el sistema debe recalcular instantáneamente:
  $$\text{Costo de Producción} = \sum (\text{cantidad}_i \times \text{costoUnitario}_i)$$
  $$\text{Margen en Pesos} = \text{Precio de Lista} - \text{Costo de Producción}$$
  $$\text{Margen en Porcentaje} = \frac{\text{Margen en Pesos}}{\text{Precio de Lista}} \times 100$$
* **Criterio:** Si el margen es inferior a 0 (costo supera al precio), el sistema debe mostrar un indicador de alerta crítica (`marca-tomate`, "PÉRDIDA"). Si el margen es menor al 30%, advertencia moderada (`marca-otono`). Si es mayor o igual al 30%, margen saludable (`marca-lima` / `marca-canela`).

### RF-03: Alta y Edición de Receta (Composición de Ingredientes)
* **Event-driven:** Cuando el usuario abre el formulario de receta (nueva o editar), el sistema debe permitir:
  1. Definir datos comerciales: Nombre, Categoría, Unidad de Venta, Precio de Lista y Stock Mínimo sugerido en freezer.
  2. Seleccionar materias primas disponibles desde la base de datos de insumos (SPEC-001).
  3. Indicar la cantidad requerida de cada insumo por unidad de venta.
  4. Agregar múltiples ingredientes y removerlos dinámicamente.
  5. Ver el subtotal de costo por ingrediente y el total acumulado en vivo.
* **Criterio:** Al guardar, se debe persistir el producto en la tabla `productos` y sus vínculos en `receta_ingredientes`. La lista principal debe actualizarse sin recargar la pantalla.

### RF-04: Eliminación Segura de Producto/Receta
* **Event-driven:** Cuando el usuario solicita eliminar una receta, el sistema debe requerir confirmación modal accesible.
* **Criterio:** Al confirmar, se elimina el producto y automáticamente sus relaciones en `receta_ingredientes` (vía cascada de base de datos).

### RF-05: Validaciones de Integridad y Robustez
* **Unwanted behavior:**
  - No se permite guardar una receta sin nombre, con precio de lista negativo o sin al menos un ingrediente válido con cantidad mayor a cero.
  - No se permite duplicar el mismo ingrediente en una misma receta (se suma o se actualiza la cantidad).
  - Los mensajes de validación deben ser claros, en español y con contraste WCAG AA.

---

## 3. Requisitos de UI / UX & Accesibilidad

1. **Mobile-First Estricto (375px a 420px):** Diseñado para operar con una sola mano en la cocina o mostrador.
2. **Cero Cards sobre Cards:** Listas limpias con separadores sutiles, botones de acción claros y zonas de toque mínimas de 44x44px.
3. **5 Estados Mandatorios en Todo Control:**
   - Botones (primarios, secundarios, destructivos, agregar ingrediente): `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
   - Inputs y Selects: `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
4. **Paleta de Identidad Lo de Caro:**
   - Canela (`#A6613A`), Beige (`#F8F7E1`), Tomate (`#C13828`), Otoño (`#E56B31`), Lima (`#C0D873`).
