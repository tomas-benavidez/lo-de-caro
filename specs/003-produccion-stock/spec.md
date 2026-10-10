# Especificación Funcional: Módulo de Producción y Stock de Congelados

- **Identificador:** `SPEC-003`
- **Módulo:** Producción y Stock de Congelados
- **Estado:** Listo para Implementación
- **Depende de:** `SPEC-001` (Materias Primas) y `SPEC-002` (Recetas y Costeo)

---

## 1. Objetivo y Contexto de Negocio

En la cocina de Caro, una vez que las materias primas están registradas con sus costos y las recetas de los productos están estandarizadas, el proceso diario fundamental es **cocinar tandas de comida casera** (ravioles, canelones, empanadas, tartas, etc.).

Al cocinar una tanda:
1. **Consumo de Insumos:** Se utilizan cantidades precisas de materias primas crudas (harina, huevos, carne, verduras) que deben descontarse automáticamente del inventario para no tener que contarlas a mano.
2. **Abastecimiento del Freezer:** Los productos terminados se congelan y pasan a estar listos para la venta al público. Su stock en freezer debe incrementarse inmediatamente.
3. **Trazabilidad y Rendimiento:** Se debe registrar qué día se cocinó, qué producto, cuántas unidades exactas se obtuvieron y observaciones operativas (ej. "Rindió 2 cajas extra", "Masa más húmeda").
4. **Control del Stock de Congelados:** Caro necesita saber en todo momento cuántas cajas o porciones de cada plato tiene congeladas en el freezer y cuáles están en nivel crítico o necesitan reposición urgente.

Este módulo cierra el puente entre la cocina y el mostrador:
- Visualizar el stock de productos congelados listos para la venta con alertas de stock mínimo.
- Registrar lotes de producción con selección del plato elaborado y cantidad de unidades.
- Previsualizar en vivo el impacto del lote sobre los insumos disponibles antes de confirmar.
- Descontar de forma atómica y segura las materias primas según la receta y sumar el producto terminado al freezer.
- Mantener un historial accesible de lotes de producción elaborados con opción de cancelación/reversión si hubo un error de carga.

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Visualización y Estado del Stock de Congelados
* **Ubiquitous:** El sistema debe listar todos los productos activos mostrando:
  - Nombre del producto y categoría comercial.
  - Stock actual disponible en el freezer (`stockActual`).
  - Stock mínimo de seguridad configurado (`stockMinimo`).
  - Unidad de venta (`Porción`, `Docena`, `Kilo`, `Unidad`).
  - Alerta de estado de stock:
    - **CRÍTICO / SIN STOCK:** `stockActual === 0` (color tomate `marca-tomate`).
    - **REPONER:** `stockActual <= stockMinimo && stockActual > 0` (color otoño `marca-otono`).
    - **OK / SALUDABLE:** `stockActual > stockMinimo` (color lima `marca-lima`).

### RF-02: Registro de Lote de Producción (Cocinar Tanda)
* **Event-driven:** Cuando el usuario presiona "+ Cocinar Lote" o "+ Registrar Producción", el sistema debe abrir un formulario modal accesible donde pueda:
  1. Seleccionar el producto a cocinar entre los productos activos que tengan receta definida.
  2. Indicar la cantidad elaborada (`cantidadElaborada` > 0).
  3. Indicar la fecha de elaboración (por defecto la fecha actual `YYYY-MM-DD`).
  4. Agregar notas u observaciones del lote (opcional).
* **Criterio:** Mientras el usuario ajusta la cantidad elaborada, el sistema debe mostrar en vivo la lista de ingredientes que se consumirán:
  $$\text{Cantidad a descontar}_i = \text{cantidadElaborada} \times \text{cantidadReceta}_i$$
  Mostrando stock actual de la materia prima, consumo requerido y remanente proyectado.

### RF-03: Validación Previa de Disponibilidad de Insumos
* **Unwanted behavior:** Si alguna materia prima requerida no tiene stock suficiente para cubrir la cantidad a elaborar:
  - El sistema debe señalar claramente el insumo faltante con advertencia visual explícita en español.
  - Se debe permitir a Caro confirmar conscientemente si desea forzar el registro (quedando stock en cero o negativo para no bloquear la cocina real) o cancelar para ajustar la compra primero.

### RF-04: Transaccionalidad y Descuento Atómico de Stock
* **Ubiquitous:** Al confirmar el registro de un lote de producción:
  1. Se descuenta el stock de cada materia prima asociada a la receta en la tabla `materias_primas`:
     $$\text{stock\_actual} = \text{stock\_actual} - (\text{cantidadElaborada} \times \text{cantidadReceta}_i)$$
  2. Se incrementa el stock del producto terminado en la tabla `productos`:
     $$\text{stock\_actual} = \text{stock\_actual} + \text{cantidadElaborada}$$
  3. Se persiste el registro en la tabla `lotes_produccion` con `fecha`, `producto_id`, `cantidad_elaborada` y `observaciones`.
  4. Si ocurre cualquier error durante el proceso, se debe ejecutar rollback defensivo garantizando que no queden datos inconsistentes.

### RF-05: Historial de Lotes Elaborados y Trazabilidad
* **Ubiquitous:** El sistema debe mostrar el listado cronológico de lotes cocinados ordenados del más reciente al más antiguo:
  - Fecha de elaboración.
  - Nombre del producto y categoría.
  - Cantidad elaborada con su unidad de venta.
  - Observaciones registradas.
  - Opción de eliminar/anular un lote registrado por error, restituyendo los insumos consumidos y descontando del freezer las unidades correspondientes.

---

## 3. Requisitos de UI / UX & Accesibilidad

1. **Mobile-First Estricto (375px a 420px):** Operable en cocina con una sola mano, tipografías grandes y legibles.
2. **Cero Cards sobre Cards:** Estructura limpia de resumen superior de stock de freezer y lista inferior de lotes elaborados.
3. **5 Estados Mandatorios en Todo Control:**
   - Botones (primarios, secundarios, destructivos, toggle): `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
   - Inputs numéricos, de fecha y selectores: `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
4. **Paleta de Identidad Gastronómica Lo de Caro:**
   - Canela (`#A6613A`), Beige (`#F8F7E1`), Tomate (`#C13828`), Otoño (`#E56B31`), Lima (`#C0D873`).
