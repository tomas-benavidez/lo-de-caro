# Especificación Funcional y de Dominio - MVP "Lo de Caro"

Este documento consolida el alcance, las entidades y las reglas de negocio definitivas para el **MVP de "Lo de Caro"**. Unifica la operatoria real del Excel histórico con el motor de recetas y costos solicitado por el cliente.

---

## 1. Objetivo del MVP
Reemplazar y profesionalizar la planilla de Excel mediante una aplicación mobile-first que resuelva dos dolores simultáneos:
1. **Administración y Caja (Lo que hacía el Excel):** Registro de ventas (cobradas/pendientes), control de clientes, libro de gastos y balance mensual.
2. **Control de Cocina y Costeo (Lo que el Excel no podía hacer):** Stock de materias primas con alertas mínimas, recetas con costo por porción, producción que descuenta ingredientes crudos y suma congelados terminados, y calculadora de metas de ganancia.

---

## 2. El Circuito Operativo en 4 Pasos

```
[1. COMPRA] ──→ Ingresa Materia Prima (stock y costo unitario)
      │
      ▼
[2. COCINA] ──→ Producción descuenta Materia Prima según Receta
      │         y suma Producto Terminado al freezer
      ▼
[3. VENTA]  ──→ Venta descuenta Producto Terminado del freezer
      │         y registra cobro o deuda del Cliente
      ▼
[4. BALANCE] ──→ Cruce de Ventas vs Gastos + Calculadora de Meta ($300k)
```

---

## 3. Modelo de Entidades del Dominio

### A. Materia Prima (Insumo)
* `id` (Identificador único)
* `nombre` (ej. "Carne picada especial", "Cebolla", "Tapas de empanada")
* `unidad_medida` (gramos `g`, mililitros `ml`, unidades `u`)
* `costo_unitario` ($ por g, ml o u — actualizado con cada compra)
* `stock_actual` (cantidad disponible en depósito/alacena)
* `stock_minimo` (umbral para disparar alerta visual de "REPONER")

### B. Producto y Receta
* `id` (Identificador único)
* `nombre` (ej. "Raviolones de Osobuco", "Empanadas de Carne", "Tarta de Atún")
* `categoria` (`Pastas Rellenas`, `Pastas Lisas`, `Empanadas`, `Tartas`, `Salsas`)
* `unidad_venta` (`Porción`, `Docena`, `Kilo`, `Unidad`)
* `precio_lista` (Precio de venta sugerido al público)
* `stock_actual` (Cantidad de unidades elaboradas listas en el freezer)
* `stock_minimo` (Umbral de reposición del freezer, ej. 5 unidades)
* `ingredientes` (Fórmula de la receta para 1 unidad de venta):
  * `materia_prima_id` (Referencia)
  * `cantidad` (g, ml o u necesarias por porción)
* `costo_produccion` (Calculado automáticamente: $\sum (\text{cantidad} \times \text{costo\_unitario})$)
* `margen_ganancia` (Calculado: $\text{precio\_lista} - \text{costo\_produccion}$ y porcentaje sobre venta)

### C. Lote de Producción
* `id` (Identificador único)
* `fecha` (Fecha de elaboración)
* `producto_id` (Producto cocinado)
* `cantidad_elaborada` (Unidades fabricadas)
* `observaciones` (Notas del lote, ej. "Rindió 2 unidades extra")
* **Efecto en inventario:**
  * Descuenta de Materia Prima: $\text{cantidad\_elaborada} \times \text{ingredientes}$
  * Incrementa en Producto: $+\text{cantidad\_elaborada}$ al freezer

### D. Venta y Cliente
* `id` (Identificador único)
* `fecha` (Fecha de la operación)
* `cliente_id` (Referencia al cliente)
* `items`:
  * `producto_id`
  * `cantidad`
  * `precio_cobrado_real` (Permite aplicar descuentos manuales en el mostrador)
* `estado_pago` (`Pagado`, `Pendiente`, `Regalo`)
* **Efecto en inventario y caja:**
  * Descuenta de Producto: $-\text{cantidad}$ del freezer
  * Si está `Pagado`: ingresa a caja real
  * Si está `Pendiente`: queda registrado en la cuenta corriente del cliente

### E. Gasto (Libro Diario)
* `id` (Identificador único)
* `fecha` (Fecha del desembolso)
* `concepto` (ej. "Compra verduras mayorista", "Bolsas polipropileno", "Gas garrafa")
* `categoria` (`Materia Prima`, `Packaging`, `Servicios / Operativo`, `Equipamiento`)
* `monto` (Total pagado)
* *(Si es compra de Materia Prima, actualiza el stock y el costo unitario del insumo).*

### F. Cliente
* `id` (Identificador único)
* `nombre_apellido` (ej. "Verónica Molina", "Nehuén")
* `telefono` (Opcional)
* `saldo_pendiente` (Suma acumulada de ventas en estado `Pendiente`)

---

## 4. Módulo Financiero y Planificador de Metas

### A. Resumen Mensual (Cierre de Caja)
* **Ventas Totales Cobradas:** Total dinero ingresado por ventas en el mes.
* **Ventas Pendientes de Cobro:** Dinero en la calle pendiente de pago.
* **Gastos Totales:** Egresos acumulados del mes.
* **Ganancia Neta Real:** $\text{Ventas Cobradas} - \text{Gastos Totales}$.
* **Margen Global (%):** $\frac{\text{Ganancia Neta}}{\text{Ventas Totales}}$.

### B. Calculadora de Objetivos (Meta Mensual)
* **Meta de Retiro / Ganancia:** Valor configurable (ej. $300.000 / mes según el Excel).
* **Volumen de Ventas Requerido:**
  $$\text{Facturación Necesaria} = \frac{\text{Meta de Ganancia}}{\text{Margen Promedio Global}}$$
* **Venta Diaria Sugerida:** $\text{Facturación Necesaria} / 30 \text{ días}$.
* **Simulador por Producto:** Permite calcular cuántas unidades específicas (ej. docenas de empanadas o cajas de pastas) se necesitan vender para alcanzar la meta.

---

## 5. Delimitación del Alcance (Boundaries)

### Dentro del MVP:
* ABM de Materias Primas con costos y alertas mínimas.
* Recetas lineales directas con cálculo automático de costo por porción.
* Carga de Lotes de Producción con doble impacto (descuenta materia prima y suma producto terminado).
* Registro de Ventas rápidas con estados (`Pagado` / `Pendiente`).
* Libro de Gastos categorizado.
* Tablero mensual financiero y planificador de metas de retiro.
* Diseño 100% Mobile-First (operable en cocina).

### Fuera del MVP (Fase 2 / Evolutivo):
* Factores matemáticos complejos de merma por cocción/desposte (se usan cantidades netas directas por receta).
* Amortización contable formal de bienes de uso.
* Asistente de cotización para eventos masivos / catering.
* Modificación automática de precios de venta (el sistema solo sugiere y alerta).
