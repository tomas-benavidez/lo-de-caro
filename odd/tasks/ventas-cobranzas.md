# ODD Feature Tasks: Módulo de Ventas y Cobranzas (SPEC-004)

- **Feature:** `ventas-cobranzas`
- **Spec:** `specs/004-ventas-cobranzas/spec.md`
- **Plan:** `specs/004-ventas-cobranzas/plan.md`
- **Objetivo:** Catálogo de clientes, registro de ventas de mostrador con canasta de productos congelados, métodos de pago (Efectivo / Transferencia), estados de cobranza (Cobrado / Pendiente / Regalo), descuento atómico de freezer y control de deudas en cuenta corriente.

## Tareas

- [x] Task 1: Modelo de Dominio y Servicios de Ventas y Cobranzas (TDD)
- [x] Task 2: Repositorios de Infraestructura `clienteRepositorio` y `ventaRepositorio` con Supabase (TDD)
- [x] Task 3: Hook de Aplicación `useVentasCobranzas`
- [x] Task 4: Componentes de Modales Accesibles (`ModalNuevaVenta`, `ModalNuevoCliente`, `ModalCobrarDeuda`)
- [x] Task 5: Componente Principal `ListaVentasCobranzas`
- [x] Task 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools
