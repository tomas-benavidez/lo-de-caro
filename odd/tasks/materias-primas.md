# Feature: Materias Primas

- **Archivo fuente:** `specs/001-materias-primas/tasks.md`
- **Identificador:** `SPEC-001` / `PLAN-001`
- **Ruta de implementación:** delegated direct (con subagentes SDD) / direct inline
- **TDD:** Desactivado por defecto (pruebas unitarias funcionales con Vitest)
- **Runner:** `npm test`

## Objetivo y Problema
Permitir a Caro registrar, consultar y actualizar todas las materias primas e insumos que compra para la elaboración de sus comidas congeladas, visualizando costos unitarios y alertas inmediatas de stock mínimo (`OK` / `REPONER`).

## Alcance Autorizado
1. Repositorio de infraestructura Supabase con tipado estricto (`materiaPrimaRepositorio.ts`).
2. Custom hook de React `useMateriasPrimas` para ciclo de vida y mutaciones.
3. Componente mobile-first `ListaMateriasPrimas.tsx` con badges de reposición en color tomate.
4. Formulario accesible `ModalNuevaMateriaPrima.tsx` implementando los 5 estados obligatorios.
5. Integración en `App.tsx` y verificación completa con Vitest y reporte de cierre.

## Criterios de Aceptación
- Todo control interactivo implementa Default, Hover, Active, Focus (`:focus-visible`), Disabled.
- Mapeo bidireccional limpio entre Postgres snake_case y TypeScript camelCase.
- Pruebas pasando al 100% con `npm test`.

## Tareas

- [x] `TASK-01`: Repositorio de Infraestructura Supabase (`src/infrastructure/repositories/materiaPrimaRepositorio.ts` y test)
  - Ruta: inline
  - Checks: `npm test` (5/5 tests pasados en materiaPrimaRepositorio.test.ts)
  - Evidencia: implementado con Vitest y mapeo tipado snake_case a camelCase

- [x] `TASK-02`: Hook de Aplicación `useMateriasPrimas` (`src/presentation/hooks/useMateriasPrimas.ts`)
  - Ruta: inline
  - Checks: `npm test` y `npm run build` pasando
  - Evidencia: implementado con useCallback, useState, tipado estricto y ordenamiento alfabético

- [x] `TASK-03`: Componente `ListaMateriasPrimas` (`src/presentation/components/ListaMateriasPrimas.tsx`)
  - Ruta: inline
  - Checks: `npm run build` exitoso
  - Evidencia: mobile-first, sin tarjetas anidadas, buscador accesible con 5 estados, badge en marca-tomate

- [ ] `TASK-04`: Modal y Formulario `ModalNuevaMateriaPrima` (`src/presentation/components/ModalNuevaMateriaPrima.tsx`)
  - Ruta: inline
  - Checks: 5 estados UI, navegación teclado, validación
  - Evidencia: Pendiente

- [ ] `TASK-05`: Integración en `App.tsx` y Verificación Final
  - Ruta: inline
  - Checks: `npm test`, `npm run build`, auditoría DevTools
  - Evidencia: Pendiente

## Próximo Paso
Ejecutar `TASK-01`: implementar `materiaPrimaRepositorio.ts` y su test unitario.
