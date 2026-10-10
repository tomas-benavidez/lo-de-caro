# Feature: Extensión de Materias Primas (Unidades kg/l, Edición y Eliminación)

- **Archivo fuente:** `specs/001-materias-primas/tasks-001.1.md`
- **Identificador:** `SPEC-001.1`
- **Ruta de implementación:** delegated direct (con subagentes SDD)
- **TDD:** Desactivado por defecto (pruebas unitarias funcionales con Vitest)
- **Runner:** `npm test`

## Objetivo y Problema
Permitir a Caro registrar insumos directamente en kilogramos (`kg`) y litros (`l`), actualizar el costo unitario cuando aumentan los precios, realizar ajustes manuales de stock y eliminar insumos en desuso con confirmación accesible.

## Alcance Autorizado
1. Migración DDL en Supabase y extensión del tipo `UnidadMedida` en el modelo de dominio.
2. Métodos `actualizar` y `eliminar` en `MateriaPrimaRepositorio` con tests unitarios.
3. Extensión del hook `useMateriasPrimas`.
4. Adaptación de `ModalNuevaMateriaPrima` para soportar edición y las nuevas unidades (`kg`, `l`).
5. Componente accesible `ModalConfirmacion` con los 5 estados de UI.
6. Integración de botones de acción en `ListaMateriasPrimas` y `App.tsx`.
7. Verificación completa y auditoría de cierre.

## Tareas

- [x] `TASK-01`: Migración DDL en Supabase y extensión del modelo (`materiaPrima.ts`)
- [x] `TASK-02`: Métodos `actualizar` y `eliminar` en `materiaPrimaRepositorio.ts` y tests
- [x] `TASK-03`: Extensión del hook `useMateriasPrimas.ts`
- [x] `TASK-04`: Soporte de edición y nuevas unidades en `ModalNuevaMateriaPrima.tsx`
- [x] `TASK-05`: Creación del componente `ModalConfirmacion.tsx`
- [x] `TASK-06`: Integración de acciones en `ListaMateriasPrimas.tsx` y `App.tsx`
- [x] `TASK-07`: Verificación final con Vitest (15/15 ok) y compilación estricta
