# Plan Técnico de Arquitectura: Módulo de Ventas y Cobranzas

- **Identificador:** `PLAN-004`
- **Módulo:** Ventas y Cobranzas (SPEC-004)
- **Enfoque:** Arquitectura Limpia + Ponytail (YAGNI, Simplicidad Extrema, Cero Bloat, Transaccionalidad Segura)

---

## 1. Diseño Arquitectónico por Capas

```
[ UI React Mobile-First: ListaVentasCobranzas / ModalNuevaVenta / ModalCobrarDeuda / ModalNuevoCliente ]
                                         │
                                         ▼
                            [ Hook: useVentasCobranzas ] ──► (Application Layer)
                                         │
                                         ▼
          [ Repositorios: ventaRepositorio, clienteRepositorio ] ──► (Infrastructure Layer)
                                         │
                                         ▼
           [ Supabase PostgreSQL: ventas, venta_items, clientes, productos ]
```

### A. Capa de Dominio (`src/domain/`)

1. **Modelos:**
   - [`src/domain/models/cliente.ts`](file:///home/tomas/lo-de-caro/src/domain/models/cliente.ts):
     - `Cliente`: Entidad con `id`, `nombreApellido`, `telefono`, `saldoPendiente`, `fechaCreacion`.
     - `NuevoClienteInput`: `{ nombreApellido: string; telefono?: string }`.
     - `RegistroPagoClienteInput`: `{ clienteId: string; monto: number; metodoPago: MetodoPago; observaciones?: string }`.
   - [`src/domain/models/venta.ts`](file:///home/tomas/lo-de-caro/src/domain/models/venta.ts):
     - `EstadoCobranza`: `'Cobrado' | 'Pendiente' | 'Regalo'` (mapeado a `estado_pago` de Postgres: `'Pagado' | 'Pendiente' | 'Regalo'`).
     - `MetodoPago`: `'Efectivo' | 'Transferencia'`.
     - `VentaItem`: `{ id?: string; ventaId?: string; productoId: string; nombreProducto: string; cantidad: number; precioUnitario: number; subtotal: number; unidadVenta?: string }`.
     - `Venta`: `{ id: string; fecha: string; clienteId?: string | null; nombreCliente?: string; total: number; estadoPago: EstadoCobranza; metodoPago: MetodoPago; items: VentaItem[]; fechaCreacion?: string }`.
     - `NuevaVentaInput`: `{ fecha?: string; clienteId?: string | null; estadoPago: EstadoCobranza; metodoPago: MetodoPago; items: Array<{ productoId: string; cantidad: number; precioUnitario: number }> }`.
     - `DisponibilidadItemVenta`: `{ productoId: string; nombreProducto: string; stockDisponible: number; cantidadRequerida: number; stockSuficiente: boolean; remanente: number }`.

2. **Servicios de Dominio:**
   - [`src/domain/services/ventaServicio.ts`](file:///home/tomas/lo-de-caro/src/domain/services/ventaServicio.ts):
     - `calcularTotalVenta(items, estadoCobranza)`: Calcula suma de subtotales $\sum (\text{cantidad} \times \text{precioUnitario})$; si es `Regalo`, el total a pagar es $0.
     - `validarDisponibilidadStock(items, productos)`: Compara cantidades a vender contra `stockActual` en freezer de cada producto y detecta faltantes.
     - `calcularResumenFinancieroVentas(ventas, clientes)`: Obtiene total cobrado acumulado, total pendiente en la calle, cantidad de clientes deudores y total de ventas realizadas.

---

### B. Capa de Infraestructura (`src/infrastructure/`)

1. **`clienteRepositorio.ts`:**
   - `listarClientes()`: Consulta `clientes` ordenados alfabéticamente por `nombre_apellido`.
   - `crearCliente(input)`: Inserta nuevo cliente en `clientes` con `saldo_pendiente = 0`.
   - `actualizarSaldoCliente(clienteId, delta)`: Incrementa o decrementa `saldo_pendiente`.
   - `registrarPagoDeuda(input)`: Decrementa `saldo_pendiente` de forma segura (sin quedar negativo).

2. **`ventaRepositorio.ts`:**
   - `listarVentas()`: Trae ventas con join a `clientes(nombre_apellido)` y `venta_items(*, productos(nombre, unidad_venta))` ordenadas por `fecha` y `created_at` descendente. Combina con metadatos de `metodo_pago` persistidos.
   - `registrarVenta(input, productos)`:
     - Realiza la transacción atómica de triple impacto:
       1. Inserta cabecera en `ventas`.
       2. Inserta ítems en `venta_items`.
       3. Descuenta `stock_actual` en `productos` para cada ítem.
       4. Si `estadoPago === 'Pendiente'` y hay `clienteId`, incrementa `clientes.saldo_pendiente`.
       5. Ante cualquier error, ejecuta rollback defensivo integral (restituye stock de productos, decrementa deuda de cliente y elimina ítems y cabecera de venta).
   - `anularVenta(ventaId)`:
     - Restituye el stock de productos del freezer, revierte el saldo pendiente del cliente si la venta estaba pendiente, y elimina la venta y sus ítems.

---

### C. Capa de Aplicación (`src/presentation/hooks/`)

1. **Hook `useVentasCobranzas`:**
   - Gestiona estado de `ventas`, `clientes`, `resumenFinanciero`, `cargando`, `error`.
   - Expone: `registrarVenta`, `anularVenta`, `crearCliente`, `cobrarDeudaCliente`, `recargar`.

---

### D. Capa de Presentación (`src/presentation/components/`)

1. **`ListaVentasCobranzas.tsx`:**
   - Encabezado con métricas de mostrador:
     - "Cobrado" (ingreso real).
     - "En la Calle" (deuda pendiente de cobro).
     - "Clientes Deudores" (cantidad de personas con saldo pendiente).
   - Pestañas internas: "Ventas Recientes" vs "Clientes y Cuentas Corrientes".
   - Acciones principales: "+ Nueva Venta" y "+ Nuevo Cliente".
   - Botón directo para "Cobrar" deuda en cada cliente y enlace a WhatsApp si tiene teléfono.
   - Botón de anular venta con confirmación modal.

2. **`ModalNuevaVenta.tsx`:**
   - Diálogo modal accesible (`role="dialog"`, `aria-modal="true"`).
   - Selector de cliente con opción "Cliente Mostrador (Sin registrar)" y acceso para dar de alta nuevo cliente en el momento.
   - Lista dinámica de productos agregados con selector de producto (muestra stock de freezer), botones de cantidad (+1, -1), input de precio cobrado unitario.
   - Selector de Estado de Cobranza: `Cobrado`, `Pendiente de cobro`, `Regalo`.
   - Selector de Método de Pago: `Efectivo` o `Transferencia`.
   - Visor de stock en vivo con advertencia si se excede el stock del freezer.
   - Total calculado en tiempo real con botón de confirmar venta.

3. **`ModalNuevoCliente.tsx`:**
   - Modal simple para registrar nombre/apellido y teléfono.

4. **`ModalCobrarDeuda.tsx`:**
   - Modal para ingresar monto cobrado a un cliente con deuda, método de pago y actualización inmediata.

5. **Integración en `src/App.tsx`:**
   - Reemplaza el placeholder de la solapa "Ventas".
   - Sincroniza recarga entre Producción, Recetas y Ventas para que el stock de freezer sea consistente en tiempo real.

---

## 2. Estrategia de Pruebas (TDD con Vitest)

1. **Dominio:** `tests/domain/ventaServicio.test.ts` (cálculo de totales, regalo, validación de stock, cálculo de resúmenes).
2. **Infraestructura:**
   - `tests/infrastructure/clienteRepositorio.test.ts` (listado, creación, pago de deudas).
   - `tests/infrastructure/ventaRepositorio.test.ts` (listado con joins, inserción atómica con descuento de freezer, actualización de cuenta corriente y rollback defensivo completo ante fallos).
3. **Compilación y Build:** `npm test` y `npm run build` sin errores.
