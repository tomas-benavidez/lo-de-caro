# Plan de Rediseño Visual — Obrador Digital "Lo de Caro"

> **Referencia de Diseño:** [docs/especificacion_diseno_marca.md](file:///home/tomas/lo-de-caro/docs/especificacion_diseno_marca.md) y Proyecto Stitch `12214678904456776125`.  
> **Mandato:** Modificación estrictamente estética. CERO cambios a la lógica de negocio, hooks, repositorios ni cálculos de costos.

## Tareas

- [x] **TASK-01: Configuración de Tokens, Fuentes y Layout Base**  
  - Incorporar la fuente Google `Rubik` en `index.html` y configurar familias en `tailwind.config.js`.  
  - Actualizar `PanelPrincipal.tsx`: Header de escritorio con solapas activas de marca, perfil de Caro y logout.  
  - Implementar Sticky Bottom Navigation Bar para mobile con los 6 módulos.  
  - Integrar alternancia de fondos (`back_1`, `back_2`, `back_3`) según la solapa activa con capa de contraste.  
  *Checks:* `npm run build` (OK), `npm test` (179/179 tests OK), layout responsivo verificado.

- [x] **TASK-02: Rediseño Visual de Materias Primas**  
  - Modernizar `ListaMateriasPrimas.tsx` según pantalla Stitch `bac160254aa546ab9ed3d8c761a6609f`.  
  - Implementar barra de 4 métricas superiores (Total, Stock Saludable, Alertas, Valuación).  
  - Adaptar filas de ingredientes con badges de stock (`crema-lima` / `hoja-otono`), costos destacados y acordeón de historial.  
  *Checks:* 179/179 tests OK, commit `65d7f5b`.

- [x] **TASK-03: Rediseño Visual de Recetas y Costeo**  
  - Actualizar `ListaRecetas.tsx` según pantalla Stitch `fc51b66d3b6f4e86a198f512aaea4014`.  
  - Tarjetas de recetas con rinde, desglose de costos (MP + Gasto Fijo), margen y precios de venta.  
  *Checks:* 179/179 tests OK, commit `620d71d`.

- [x] **TASK-04: Rediseño Visual de Producción y Freezer**  
  - Modernizar `ListaProduccion.tsx` y vistas de lotes según pantalla Stitch `67b6c10819de4eaabd82d5f8654bd57c` y móvil `23df44730589401880597839b82e1e31`.  
  - Indicadores de unidades en freezer, lotes cocinados y descuento de stock.  
  *Checks:* 179/179 tests OK, commit `0c0ae27`.

- [ ] **TASK-05: Rediseño Visual de Ventas y Mostrador**  
  - Adaptar `ListaVentasCobranzas.tsx` según pantalla Stitch `acdec45b7493476083bdbf3645c3ffcc` y móvil `b160969070b84b419b6f60e0c54987db`.  
  - Tarjetas de ventas, gestión de clientes con deudas y cobros con estética de obrador.  
  *Checks:* Tests de ventas pasando.

- [ ] **TASK-06: Rediseño Visual de Gastos y Tablero de Finanzas**  
  - Actualizar `ListaGastos.tsx` (Stitch `b0c36b7a133545f49f7af45f56d1fbd4`) y `TableroFinanzas.tsx` (Stitch `f0da3c1673914f6f8e58d891ec4349fa`).  
  - Tarjetas de balance mensual, meta editable con barra de progreso y ranking visual de productos.  
  *Checks:* Tests de finanzas y gastos pasando.

- [ ] **TASK-07: Estilo de Modales y Formularios**  
  - Adaptar contenedores de modales (`ModalNuevaMateriaPrima`, `ModalReceta`, `ModalRegistroProduccion`, `ModalNuevaVenta`, `ModalNuevoGasto`) con tarjetas `bg-white/95`, esquinas suaves, bordes canela y 5 estados en controles.  
  *Checks:* Cierre/apertura sin trabas visuales.

- [ ] **TASK-08: Verificación Final y Auditoría de Integridad**  
  - Ejecución de suite completa de pruebas unitarias (`npm test`).  
  - Auditoría de cero credenciales hardcodeadas y cero regresiones.  
  *Checks:* 179/179 tests en verde, build estático limpio.
