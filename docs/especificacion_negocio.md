# Especificación Lógica del Negocio - Sistema "La casa cocina"

Este documento contiene la especificación conceptual y las reglas de negocio definitivas para el sistema de costos, stock y rentabilidad de **"La casa cocina"** (pastas, empanadas y tartas congeladas). Su objetivo es servir como mapa lógico de referencia antes de iniciar cualquier desarrollo técnico o de base de datos.

---

## 1. Resumen de la Idea y el Problema a Resolver

El sistema está diseñado para profesionalizar la gestión administrativa y de producción de un emprendimiento familiar de elaboración de pastas, empanadas y tartas congeladas. 

### Problemas principales que resuelve:
*   **Pérdidas invisibles por desperdicios (Mermas)**: Traduce el desperdicio natural de insumos (ej. pelado, despostado, cocción) directamente al costo financiero de la receta y al descuento real de stock.
*   **Costos fijos mal imputados**: Distribuye proporcionalmente los gastos operativos y el sueldo del dueño basándose en una estimación fija mensual de producción.
*   **Desgaste de activos ignorado (Depreciación)**: Incorpora el desgaste del equipamiento (heladeras, hornos, cocinas) directamente dentro del costo de fabricación de cada lote de forma automática.
*   **Desfase de stock físico vs. teórico**: Divide el inventario en dos pasos claros (insumos $\rightarrow$ producción $\rightarrow$ congelados elaborados $\rightarrow$ ventas) permitiendo una revisión manual editable antes de confirmar los descuentos.
*   **Pérdidas de dinero por cobros pendientes**: Controla las ventas que se entregan pero quedan en estado "pendiente de cobro" asociándolas a clientes específicos.

---

## 2. Modelo de Entidades Lógicas

A continuación se definen los datos lógicos que manejará el sistema, optimizados para un diseño **Mobile-First** (pocos campos obligatorios y carga rápida).

### A. Insumo (Materia Prima / Envases)
Representa todo ingrediente o material de packaging que se compra.
*   `id` (Único)
*   `nombre` (Texto - Obligatorio - ej. "Carne Molida", "Caja para 12 empanadas")
*   `unidadMedida` (Gramo `g`, Mililitro `ml`, Unidad `u` - Obligatorio)
*   `costoBrutoUnitario` (Moneda - Calculado automáticamente al registrar una compra dividiendo el precio pagado por la cantidad comprada)
*   `stockActual` (Decimal - Cantidad en unidades base en la alacena)
*   `stockMinimo` (Decimal - Opcional - Para alertas visuales de reabastecimiento)

### B. Receta (Fórmula de Elaboración Base)
Estructura la elaboración de una unidad básica de producto.
*   `id` (Único)
*   `nombre` (Texto - Obligatorio - ej. "Sorrentino de Jamón y Queso", "Empanada de Carne")
*   `ingredientes` (Lista de Insumos vinculados):
    *   `insumoId` (Referencia)
    *   `pesoLimpio` (Decimal - Gramos/ml/u reales que van al producto final neto)
    *   `porcentajeMerma` (Decimal - Porcentaje de desperdicio estimado por pelado/cocción, ej. 20%)
*   `costoEnvase` (Moneda - Opcional - packaging individual si corresponde)
*   `costoFijoProrrateado` (Moneda - Calculado automáticamente según la estimación de producción global)

### C. Producto de Venta (Formatos y Equivalencias)
Define cómo se comercializan los productos en el mostrador a partir de la receta base.
*   `id` (Único)
*   `nombre` (Texto - Obligatorio - ej. "Docena de Empanadas de Carne", "Porción de Sorrentinos (8 unidades)")
*   `recetaId` (Referencia a la receta de la unidad base)
*   `unidadVenta` (Texto - ej. "Docena", "Porción", "Kilo", "Tarta Entera")
*   `cantidadUnidadesBase` (Entero - Multiplicador de conversión, ej. 12 para la docena, 8 para la porción de sorrentinos)
*   `precioLista` (Moneda - Precio sugerido al público)

### D. Lote de Producción (Registro de Cocina)
Registra la elaboración de pastas o empanadas y actualiza el inventario intermedio.
*   `id` (Único)
*   `fecha` (Fecha - Obligatorio)
*   `recetaId` (Referencia)
*   `cantidadProducida` (Decimal - ej. "120 unidades de sorrentinos")
*   `ingredientesConsumidos` (Lista editable de insumos con el descuento bruto propuesto)
*   `confirmado` (Booleano - Si ya impactó en el stock)

### E. Cliente
Lleva el registro de compradores para fidelización e historial de deudas.
*   `id` (Único)
*   `nombreApellido` (Texto - Obligatorio)
*   `telefono` (Texto - Opcional)
*   `notas` (Texto - Opcional)

### F. Venta (Registro de Mostrador)
Registra la salida de comida elaborada y el ingreso financiero.
*   `id` (Único)
*   `fecha` (Fecha - Obligatorio)
*   `clienteId` (Referencia a la entidad Cliente - Obligatorio)
*   `items` (Lista de Productos de Venta vendidos):
    *   `productoId` (Referencia)
    *   `cantidad` (Entero)
    *   `precioCobradoReal` (Moneda - Editable por si se hace un descuento en el momento)
*   `estadoCobro` (Estado: `Cobrada` | `Pendiente` - Obligatorio)
*   `gananciaCalculada` (Moneda - Calculada al instante: `Precio Cobrado Real - Costo de Fabricación del Lote`)

### G. Inversión (Compras de Equipamiento)
Registra egresos de capital que no son insumos del día a día pero afectan la rentabilidad a largo plazo.
*   `id` (Único)
*   `nombre` (Texto - Obligatorio - ej. "Freezer Horizontal 400L")
*   `monto` (Moneda - Obligatorio)
*   `vidaUtilAnios` (Entero - Años estimados de desgaste, ej. 10)
*   `fechaCompra` (Fecha - Obligatorio)

---

## 3. Reglas de Negocio Clave

### 1. El cálculo del costo y descuento con Factor de Merma
Al ingresar un ingrediente en una receta, el sistema realiza la siguiente matemática financiera y física:
*   **Peso Bruto Requerido** (lo que sale de la alacena crudo):
    $$\text{Peso Bruto} = \frac{\text{Peso Limpio}}{1 - (\text{Porcentaje de Merma} / 100)}$$
*   **Costo Unitario del Ingrediente**:
    $$\text{Costo Ingrediente} = \text{Peso Bruto Requerido} \times \text{Insumo.costoBrutoUnitario}$$
*   *Ejemplo*: Si una empanada lleva 30g de carne cocida (peso limpio) y la carne reduce un 30% al cocinarse (merma), la app calcula que se consumen 42.8g de carne cruda. El costo de la empanada incluirá el precio de esos 42.8g crudos, y el stock de insumos sugerirá descontar 42.8g de carne picada cruda al cocinar.

### 2. Multiplicación en cascada por Equivalencias
La receta se diseña para **1 Unidad Base** (ej. 1 sorrentino). Cuando se crea un **Producto de Venta** (ej. "Porción de 8 Sorrentinos"), la app calcula automáticamente su costo de fabricación multiplicando por el factor de conversión:
$$\text{Costo de Fabricación Producto} = \text{Costo Unidad Base Receta} \times \text{cantidadUnidadesBase} + \text{costoEnvase}$$
Esto evita que el usuario tenga que crear recetas separadas para una unidad, una porción o una docena.

### 3. Distribución Automática de Costos Fijos y Depreciaciones
*   **Costos Fijos Mensuales**: Se consolidan cargando montos fijos (Alquiler, Luz, Gas, Sueldo estimado del dueño, etc.).
*   **Depreciación Mensual Automática**: Al registrar una **Inversión** con su `monto` y `vidaUtilAnios`, la app calcula sola el desgaste mensual:
    $$\text{Depreciación Mensual} = \frac{\text{Monto}}{\text{vidaUtilAnios} \times 12}$$
    Este valor se suma automáticamente a la bolsa de Costos Fijos Mensuales.
*   **Costo Fijo Prorrateado por Unidad**: Basado en la *Estimación Mensual Fija de Producción* (ej. 1000 unidades de pastas/empanadas base al mes):
    $$\text{Costo Fijo por Unidad} = \frac{\text{Costos Fijos Totales Mensuales}}{\text{Estimación Mensual de Producción}}$$
    Este Costo Fijo se suma de forma transparente al costo de cada unidad producida para asegurar que el precio de venta sugerido cubra los gastos de estructura y el desgaste de las máquinas.

### 4. Inventario de Control en Dos Pasos con Edición Manual Editable
El stock de ingredientes no se descuenta directamente con la venta para evitar discrepancias por mermas extraordinarias:
1.  **Paso 1 (Producción)**: Cuando el usuario registra que cocinó un lote (ej. "Hoy armé 120 sorrentinos de Jamón y Queso"):
    *   La app propone el descuento teórico de insumos (harina, jamón, queso).
    *   El usuario **puede modificar** las cantidades de insumos realmente usadas antes de confirmar.
    *   Al confirmar, se descuentan los insumos de la alacena y se suman las 120 unidades de sorrentinos al freezer de productos terminados.
2.  **Paso 2 (Venta)**: Al registrar la venta de una caja en el mostrador:
    *   Se descuenta directamente el producto terminado (las pastas del freezer).
    *   El usuario también puede verificar y corregir si hay discrepancias antes de impactar la venta.

### 5. Asistente de Eventos y Pedidos Grandes (Calculadora de Compras)
Al ingresar un pedido grande (ej. 100 docenas de empanadas), el sistema suma los requerimientos totales de insumos y ofrece dos modos de cálculo:
*   **Modo Neto (Por defecto)**: Resta el stock actual de materias primas disponible en la alacena, indicando exactamente qué falta comprar.
*   **Modo Servicio / Evento de Terceros (Opcional)**: Ignora el stock actual y calcula el 100% de los ingredientes necesarios de cero (útil si el cliente del catering provee los insumos o se quiere presupuestar el lote completo aislado).

### 6. Ventas Pendientes de Cobro y Seguimiento de Clientes
*   Si una venta se registra con estado `Pendiente`, la mercadería sale del stock físico inmediatamente, pero el dinero no ingresa a la caja real.
*   Toda venta `Pendiente` debe estar vinculada obligatoriamente a un **Cliente** seleccionado.
*   La app dispondrá de un panel de "Cuentas Corrientes / Deudores" donde se listarán los clientes con saldos pendientes, permitiendo marcar la deuda como `Cobrada` cuando paguen, impactando recién ahí en el reporte de caja.

### 7. Reporte de Ganancias Reales
El resumen de ganancias mensuales se calcula cruzando las ventas cobradas con los costos de producción y las inversiones:
$$\text{Ganancia Neta} = \text{Ingresos Ventas Cobradas} - \text{Costos Fabricación de lo Vendido} - \text{Inversiones de Capital Erogadas}$$
*(Las inversiones de capital se pueden visualizar por separado para no distorsionar el margen de ganancia operativa del mes).*

---

## 4. Lineamientos de Interfaz y Usabilidad (Mobile-First)

El 80% del uso del sistema se realizará desde teléfonos celulares en la cocina o detrás del mostrador. Por ende, el diseño debe seguir estas pautas estrictas:
*   **Cero burocracia de carga**: Los únicos campos obligatorios al crear registros rápidos son nombres y montos/cantidades. El resto (teléfonos, notas, stock mínimo) son opcionales.
*   **Botones y campos grandes**: Evitar elementos pequeños. Pensado para ser operado con una sola mano y dedos con harina o guantes.
*   **Carga incremental en ventas**: Selector rápido de productos con botones `+` y `-` para sumar cantidades en el mostrador con dos toques.
*   **Alertas no intrusivas**: Alertas visuales claras en amarillo/rojo si el margen de ganancia de un producto cae por debajo del objetivo del usuario debido a subas de insumos, mostrando el precio sugerido de venta pero requiriendo un botón explícito de "Aplicar" para que el usuario decida cuándo cambiarlo.
