# Especificación Funcional: Módulo de Ventas y Cobranzas

- **Identificador:** `SPEC-004`
- **Módulo:** Ventas y Cobranzas
- **Estado:** Listo para Implementación
- **Depende de:** `SPEC-001` (Materias Primas), `SPEC-002` (Recetas y Costeo), `SPEC-003` (Producción y Stock de Congelados)

---

## 1. Objetivo y Contexto de Negocio

En el día a día de "Lo de Caro", una vez elaboradas las tandas de comida casera y almacenadas en el freezer (ravioles, canelones, empanadas, tartas, etc.), el paso crítico comercial es el **mostrador de ventas y el control de cobros**.

Caro atiende tanto a clientes de paso (venta al mostrador rápida) como a clientes habituales (vecinos, familias, pedidos por encargo). Muchas veces:
1. **Cobro Inmediato:** El cliente retira sus cajas o docenas y paga en el acto, ya sea en **Efectivo** o mediante **Transferencia bancaria / Mercado Pago**.
2. **Venta Fiada / Cuenta Corriente (Pendiente de Cobro):** Un cliente habitual retira comida y queda debiendo el importe para saldarlo el fin de semana o a fin de mes. Caro necesita saber exactamente cuánto le debe cada cliente y cuánto dinero total tiene "en la calle".
3. **Regalo / Degustación:** Ocasionalmente se entrega un producto como atención comercial o degustación sin generar deuda ni ingreso monetario, pero descontando el stock del freezer.
4. **Descuento Inmediato de Freezer:** Cada producto vendido debe descontarse automáticamente del stock de productos congelados (`productos.stock_actual`) para mantener el inventario real siempre sincronizado.
5. **Flexibilidad en Precios:** Si bien cada producto tiene su precio de lista oficial, Caro necesita la libertad de ajustar el precio cobrado real en mostrador si aplica una promoción o descuento especial.
6. **Gestión de Cobranzas:** Poder registrar pagos de clientes para saldar o amortizar sus saldos pendientes sin alterar el inventario de comida.

Este módulo completa el ciclo operativo del negocio:
- Resumen financiero de mostrador: total cobrado hoy/mes y dinero en la calle por cobrar.
- Registro ágil de ventas con selector de cliente y canasta de productos.
- Métodos de pago (Efectivo / Transferencia) y estados (Cobrado / Pendiente / Regalo).
- Descuento atómico de stock del freezer con rollback ante fallos.
- Directorio de clientes con saldos pendientes, botón de cobranza rápida y enlace de contacto.

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Catálogo y Gestión de Clientes
* **Ubiquitous:** El sistema debe listar todos los clientes registrados mostrando:
  - Nombre y apellido.
  - Teléfono de contacto (con botón de acceso rápido para comunicarse vía WhatsApp o llamada).
  - Saldo pendiente actual acumulado.
  - Alerta visual si tiene deuda pendiente (> $0 en color tomate/otoño) o si está al día ($0 en color lima).
* **Event-driven:** El usuario puede crear un nuevo cliente proporcionando nombre y apellido (obligatorio) y teléfono (opcional).
* **Event-driven:** El usuario puede buscar clientes en tiempo real por nombre o teléfono.

### RF-02: Registro de Ventas y Pedidos de Mostrador
* **Event-driven:** Al pulsar "+ Nueva Venta", se abre un formulario modal donde el usuario puede:
  1. Seleccionar un cliente registrado o elegir "Cliente Mostrador / Ocasional".
  2. Agregar uno o más productos a la venta indicando cantidad y precio unitario cobrado (precargado con el `precioLista` del producto).
  3. Indicar la fecha de la venta (por defecto fecha actual `YYYY-MM-DD`).
  4. Indicar el estado de cobranza: `Cobrado` (Pagado), `Pendiente de cobro` (Pendiente) o `Regalo / Degustación` (Regalo).
  5. Si el estado es `Cobrado`, seleccionar el método de pago: `Efectivo` o `Transferencia`.
  6. Visualizar en vivo el total de la venta calculado automáticamente:
     $$\text{Total} = \sum (\text{cantidad}_i \times \text{precioCobrado}_i)$$
     *(Si es Regalo, el total efectivo a cobrar es $0).*

### RF-03: Validación y Alertas de Stock de Freezer
* **Criterio:** Durante la carga de la venta, el sistema muestra el stock disponible en freezer de cada producto seleccionado.
* **Unwanted behavior:** Si la cantidad ingresada supera el stock disponible en el freezer:
  - El sistema muestra una advertencia clara en español indicando el stock actual y el faltante.
  - Se permite a Caro continuar si conscientemente decide entregar stock no registrado o cancelar para revisar el freezer.

### RF-04: Transaccionalidad Atómica y Descuento de Stock
* **Ubiquitous:** Al confirmar una venta:
  1. Se descuenta el stock de cada producto en la tabla `productos`:
     $$\text{stock\_actual} = \text{stock\_actual} - \text{cantidadVenta}$$
  2. Se inserta el registro principal en la tabla `ventas` con `fecha`, `cliente_id`, `total` y `estado_pago` (`Pagado`, `Pendiente`, `Regalo`).
  3. Se insertan las filas correspondientes en `venta_items` con `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal`.
  4. Si `estado_pago === 'Pendiente'` y hay un `cliente_id` asociado, se incrementa el saldo adeudado del cliente en la tabla `clientes`:
     $$\text{saldo\_pendiente} = \text{saldo\_pendiente} + \text{total}$$
  5. Ante cualquier error de red o base de datos en los pasos intermedios, se ejecuta un rollback defensivo integral (restituyendo stock de productos, revirtiendo saldo de cliente y eliminando registros parciales).

### RF-05: Historial de Ventas y Anulación con Restitución
* **Ubiquitous:** El sistema debe mostrar el listado cronológico de ventas ordenadas de la más reciente a la más antigua:
  - Fecha de venta.
  - Nombre del cliente o "Cliente Mostrador".
  - Desglose de productos y unidades vendidas.
  - Total de la venta y badge de estado (`Cobrado (Efectivo/Transferencia)`, `Pendiente`, `Regalo`).
  - Botón de anular/eliminar venta con confirmación modal accesible:
    - Restituye las unidades al stock del freezer en `productos`.
    - Si la venta estaba `Pendiente`, descuenta el importe del `saldo_pendiente` del cliente.
    - Elimina la venta y sus ítems en cascada.

### RF-06: Cobranza de Saldos Pendientes (Cuentas Corrientes)
* **Event-driven:** Desde la ficha o lista de un cliente con saldo deudor, el usuario puede presionar "Cobrar / Registrar Pago":
  - Modal accesible para ingresar el monto a cobrar (por defecto el total adeudado o un abono parcial) y método de pago (Efectivo o Transferencia).
  - Al confirmar, actualiza el `saldo_pendiente` en `clientes`:
    $$\text{saldo\_pendiente} = \max(0, \text{saldo\_pendiente} - \text{montoCobrado})$$

---

## 3. Requisitos de UI / UX & Accesibilidad

1. **Mobile-First Estricto (375px a 420px):** Diseñado para operar en pantalla táctil de celular en el mostrador.
2. **Cero Cards sobre Cards:** Jerarquía clara con tarjetas planas, bordes nítidos y padding confortable.
3. **5 Estados Obligatorios en Todo Control Interactivo:**
   - Botones (primarios, secundarios, destructivos, chips de filtro): `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
   - Inputs (numéricos, textos, fechas, selects): `Default`, `Hover`, `Active`, `Focus` (`:focus-visible`), `Disabled`.
4. **Paleta de Identidad Gastronómica Lo de Caro:**
   - Canela (`#A6613A`), Beige (`#F8F7E1`), Tomate (`#C13828`), Otoño (`#E56B31`), Lima (`#C0D873`).
5. **Accesibilidad WAI-ARIA:** Modales con `role="dialog"`, `aria-modal="true"`, foco cautivo al abrir, restauración de foco al cerrar y tecla `Escape`.
