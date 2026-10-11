# Especificación Funcional: Módulo de Gastos y Egresos Operativos

- **Identificador:** `SPEC-005`
- **Módulo:** Gastos y Egresos Operativos (Libro Diario de Compras)
- **Estado:** Listo para Implementación
- **Depende de:** `SPEC-001` (Materias Primas), `SPEC-002` (Recetas y Costeo), `SPEC-004` (Ventas y Cobranzas)

---

## 1. Objetivo y Contexto de Negocio

En la rutina comercial y de producción de "Lo de Caro", además de producir y vender, el control riguroso de las salidas de dinero (egresos) es indispensable para la salud del emprendimiento. 

Caro realiza diferentes tipos de desembolsos a lo largo de la semana y el mes:
1. **Compras de Materia Prima e Insumos:** Harinas, ricota, verduras, carne, condimentos, etc. Cuando Caro va al mayorista o a la verdulería, necesita que la compra quede asentada como gasto y, al mismo tiempo, que **actualice de forma automática el stock y el costo unitario de ese ingrediente** en el sistema para que las fichas técnicas de recetas sigan reflejando el costo real.
2. **Descartables y Packaging:** Cajas para pastas, bandejas termosellables, bolsas de polipropileno, etiquetas, separadores de empanadas.
3. **Servicios y Operativo del Local:** Factura de gas (garrafas o red), luz eléctrica (vital para los freezers), agua, alquiler o expensas del espacio de trabajo.
4. **Mantenimiento y Equipamiento:** Compra o reparación de sobadoras, selladoras de bandejas, moldes de ravioles, cuchillas, mantenimiento de freezer.
5. **Varios y Otros:** Artículos de limpieza, papelería, delivery o fletes menores.

El control de estos egresos alimenta de forma directa el **Módulo de Finanzas y Balance Mensual**:
$$\text{Ganancia Neta Real} = \text{Ventas Cobradas} - \text{Gastos Totales}$$

Además, Caro necesita conocer el **método de pago utilizado** (Efectivo vs. Transferencia / Mercado Pago) para realizar el arqueo de caja física y la conciliación del dinero bancarizado.

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Libro Diario de Gastos y Registro Cronológico
* **Ubiquitous:** El sistema debe listar todos los gastos registrados en orden cronológico descendente (el más reciente primero), mostrando:
  - Fecha del gasto (`YYYY-MM-DD`).
  - Concepto o descripción clara (ej. "Compra 25kg Harina 0000 Molino", "Garrafa de gas 10kg", "500 Cajas de ravioles").
  - Categoría con badge visual distintivo: `Materia Prima`, `Packaging`, `Servicios`, `Equipamiento`, `Otros`.
  - Método de pago con badge: `Efectivo` o `Transferencia`.
  - Monto total en pesos ($).
  - Indicador de impacto en inventario si la compra actualizó el stock de una materia prima (ej. `+25 kg stock`).
  - Acción accesible para eliminar/anular gasto con diálogo de confirmación.

### RF-02: Registro de Gastos con Categorización y Métodos de Pago
* **Event-driven:** Al pulsar "+ Nuevo Gasto", se abre un formulario modal accesible donde el usuario puede ingresar:
  1. Concepto o detalle del gasto (obligatorio, no vacío).
  2. Categoría del gasto:
     - `Materia Prima` (compras de insumos e ingredientes)
     - `Packaging` (cajas, bandejas, bolsas, etiquetas)
     - `Servicios` (gas, luz, agua, alquiler, conectividad)
     - `Equipamiento` (herramientas, moldes, máquinas, reparaciones)
     - `Otros` (artículos de limpieza, fletes, varios)
  3. Monto total en pesos ($) (número positivo > 0).
  4. Fecha del gasto (por defecto fecha actual `YYYY-MM-DD`).
  5. Método de pago: `Efectivo` o `Transferencia`.

### RF-03: Vínculo Directo con Materia Prima (Incremento de Stock y Actualización de Costo)
* **Ubiquitous:** Cuando la categoría seleccionada es `Materia Prima`:
  - Se presenta la opción de vincular la compra a un ingrediente existente en el catálogo de materias primas.
  - El usuario puede seleccionar el ingrediente de la lista (con su unidad de medida y stock actual visibles).
  - El usuario ingresa la cantidad comprada en la unidad correspondiente.
  - El sistema calcula y muestra en vivo el nuevo costo unitario resultante:
    $$\text{Nuevo Costo Unitario} = \frac{\text{Monto}}{\text{Cantidad Comprada}}$$
  - Se incluye un selector para decidir si actualizar el `costo_unitario` de la materia prima con este nuevo valor o únicamente sumar el stock.
* **Event-driven:** Al guardar el gasto vinculado:
  - Se incrementa el `stock_actual` de la materia prima:
    $$\text{stock\_actual} = \text{stock\_actual} + \text{cantidadComprada}$$
  - Si se activó la actualización de costo, se actualiza el `costo_unitario` de la materia prima.
  - Ante cualquier error al actualizar la materia prima, se ejecuta un rollback defensivo integral eliminando el gasto recién creado.

### RF-04: Métricas y Resumen de Egresos
* **Ubiquitous:** En la parte superior de la vista de gastos, el sistema presenta un panel de métricas con:
  1. **Total Egresos:** Sumatoria acumulada de todos los gastos del período/mes.
  2. **Materia Prima:** Total gastado en ingredientes (costo directo de mercadería).
  3. **Operativos y Fijos:** Total de gastos en servicios, packaging, equipamiento y otros.
  4. **Efectivo vs. Transferencia:** Total desembolsado en efectivo y total por transferencia bancaria (esencial para el arqueo de caja diaria).

### RF-05: Filtros y Búsqueda Ágil
* **Event-driven:** El usuario puede filtrar y encontrar gastos rápidamente mediante:
  - Buscador por texto en el concepto.
  - Selector/chips por categoría: `Todas`, `Materia Prima`, `Packaging`, `Servicios`, `Equipamiento`, `Otros`.
  - Filtro por método de pago: `Todos`, `Efectivo`, `Transferencia`.

### RF-06: Anulación de Gastos con Restitución de Stock
* **Event-driven:** Al solicitar la eliminación de un gasto:
  - Se solicita confirmación mediante un modal accesible.
  - Si el gasto tenía una compra de materia prima vinculada, se restituye el stock (se resta la cantidad que se había sumado, sin permitir stock negativo):
    $$\text{stock\_actual} = \max(0, \text{stock\_actual} - \text{cantidadComprada})$$
  - Se elimina el registro de la tabla `gastos`.

---

## 3. Requisitos de UI / UX & Accesibilidad

1. **Mobile-First Estricto (375px a 420px):** Operable con una sola mano en la cocina o en el mercado.
2. **Cero Cards sobre Cards (Filosofía Ponytail):** Tarjetas planas y limpias con separación por divisores sutiles y padding ergonómico.
3. **5 Estados Obligatorios en Todo Control UI:**
   - Botones (primarios, secundarios, destructivos, chips de filtro): `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
   - Inputs (numéricos, textos, fechas, selects, checkboxes): `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
4. **Paleta de Marca Lo de Caro:**
   - Canela (`#A6613A`), Beige (`#F8F7E1`), Tomate (`#C13828`), Otoño (`#E56B31`), Lima (`#C0D873`).
5. **Accesibilidad WAI-ARIA:** Modales con `role="dialog"`, `aria-modal="true"`, foco en el primer campo al abrir, restauración de foco al cerrar y soporte de tecla `Escape`.
