# Bitácora de Errores Conocidos y Lecciones Aprendidas

Este documento es el registro vivo de trampas técnicas, errores encontrados y lecciones aprendidas durante el desarrollo de **"Lo de Caro"**. Su objetivo es servir como memoria antirregresiones para el equipo de desarrollo y los subagentes.

---

## Formato de Registro
Cada entrada debe documentar:
* **Fecha / Tarea:** Identificador de la tarea o momento en que ocurrió.
* **Síntoma / Error:** Qué falló o qué comportamiento inesperado se observó.
* **Causa Raíz:** Por qué ocurrió técnicamente.
* **Solución Aplicada:** Cómo se corrigió.
* **Regla Antirregresión:** Qué debemos chequear o evitar a futuro para que no vuelva a pasar.

---

## Entradas Registradas

### [2026-10-09] Conexión MCP de Supabase en CLI
* **Síntoma:** Error `HTTP 401 Unauthorized` al intentar conectar el endpoint de Supabase MCP por URL directa.
* **Causa Raíz:** El endpoint de `mcp.supabase.com/mcp` asume por defecto un flujo OAuth con navegador web interactivo, el cual no está disponible en la terminal pura (`agy`).
* **Solución Aplicada:** Se generó un Personal Access Token (PAT) con permisos de escritura en la cuenta de Supabase y se configuró como cabecera `Authorization: Bearer sbp_...` en `~/.gemini/config/mcp_config.json`.
* **Regla Antirregresión:** Para cualquier integración con Supabase en entornos de consola/CI/CD, utilizar cabeceras de autorización con PAT en lugar de depender de redirecciones OAuth del navegador.

### [2026-10-12] Ventas Pendientes no saldadas ante Pagos Parciales en Cuotas
* **Fecha / Tarea:** Tarea 1 - Cierre MVP / Módulo de Cobranzas y Finanzas.
* **Síntoma / Error:** Cuando un cliente abonaba una venta fiada/pendiente en pagos fraccionados (ejemplo: 2 pagos de $5.000 para una venta de $10.000), el saldo de la cuenta corriente del cliente llegaba a $0, pero la venta permanecía indefinidamente en estado `Pendiente` en el historial de ventas recientes y nunca sumaba al `totalCobrado` de Finanzas ni en el resumen financiero de mostrador.
* **Causa Raíz:** El método `saldarVentasPendientes` de `VentaRepositorio` comparaba únicamente el monto aislado del pago individual (`monto`) contra el total de cada venta (`remanente >= totalVenta`). En pagos parciales donde cada cuota era menor al importe total de la venta, la condición jamás se cumplía de forma aislada, ignorando la deuda acumulada real y el saldo resultante del cliente.
* **Solución Aplicada:** 
  1. Se actualizó `saldarVentasPendientes` para recibir opcionalmente `saldoClienteActual` o consultarlo directamente desde la entidad `clientes`.
  2. Si el saldo restante del cliente es $0, todas las ventas pendientes asociadas se liquidan automáticamente a estado `Pagado` (`Cobrado`).
  3. Si el cliente mantiene deuda parcial, el remanente disponible para saldar ventas cronológicas se calcula como `totalDeudaVentas - saldoCliente`, garantizando que la acumulación de pagos cubra las ventas más antiguas a medida que se completan.
  4. En `useVentasCobranzas.ts`, `cobrarDeudaCliente` inyecta inmediatamente el nuevo `saldoPendiente` resultante y recarga el listado de ventas para que `resumenVentas.totalCobrado` y la solapa de Finanzas sincronicen al instante.
  5. Se implementó una cláusula de interrupción estricta (`break`) si el dinero remanente no alcanza a cubrir la venta cronológica más antigua analizada. Esto previene que una cuota parcial saltee la deuda más vieja para saldar indebidamente ventas más recientes de menor importe.
* **Regla Antirregresión:** Todo proceso de amortización de deuda o cuenta corriente debe verificar la relación global entre el saldo contable remanente del cliente y la suma de sus comprobantes pendientes, en lugar de evaluar únicamente el monto atómico de cada pago por separado. Además, el algoritmo FIFO debe interrumpirse con `break` si un comprobante no es cubierto en su totalidad, evitando salteos cronológicos de comprobantes. Pruebas unitarias deben incluir expresamente escenarios de pagos en múltiples cuotas y verificación de orden FIFO estricto.


