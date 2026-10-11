# ODD Feature Tasks: Módulo de Gastos y Egresos (SPEC-005)

- **Feature:** `gastos-egresos`
- **Spec:** `specs/005-gastos-egresos/spec.md`
- **Plan:** `specs/005-gastos-egresos/plan.md`
- **Objetivo:** Registro de egresos y gastos operativos, compras de materia prima e insumos con impacto directo en stock y costo unitario, categorización (Materia Prima, Packaging, Servicios, Equipamiento, Otros), métodos de pago (Efectivo / Transferencia), métricas financieras y anulación con restitución de inventario.

## Tareas

- [x] Task 1: Modelo de Dominio y Servicios de Gastos y Egresos (TDD)
- [x] Task 2: Repositorio de Infraestructura `gastoRepositorio` con Supabase (TDD)
- [x] Task 3: Hook de Aplicación `useGastos`
- [x] Task 4: Componente Accesible `ModalNuevoGasto` (5 Estados UI)
- [x] Task 5: Componente Principal `ListaGastos` (Mobile-First y 5 Estados)
- [x] Task 6: Integración en `App.tsx` y Auditoría en Vivo con DevTools
