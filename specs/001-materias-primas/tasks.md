# Tareas de Implementación: Módulo de Materias Primas

- **Módulo:** SPEC-001 / PLAN-001
- **Regla:** Una sola tarea por iteración. Cada tarea implementada con `/boost` obligatorio y explicada con CÓMO, POR QUÉ y PARA QUÉ.

---

## Lista Atómica de Tareas

- [x] **Tarea 1: Repositorio de Infraestructura Supabase**
  * **Descripción:** Implementar `src/infrastructure/repositories/materiaPrimaRepositorio.ts` con métodos `listarMateriasPrimas()` y `crearMateriaPrima()` mapeando entre snake_case de Postgres y camelCase de TypeScript.
  * **Criterio de Aceptación:** Consultas tipadas a Supabase funcionando y probadas con test unitario en `tests/infrastructure/`.
  * **Verificación:** Ejecución de `npm test` con Vitest (5/5 tests superados).
  * **Archivos:** `src/infrastructure/repositories/materiaPrimaRepositorio.ts`, `tests/infrastructure/materiaPrimaRepositorio.test.ts`.

- [ ] **Tarea 2: Hook de Aplicación `useMateriasPrimas`**
  * **Descripción:** Crear el hook `src/presentation/hooks/useMateriasPrimas.ts` para gestionar el estado de carga (`cargando`), lista de insumos (`materiasPrimas`), errores y función para refrescar/crear.
  * **Criterio de Aceptación:** Manejo de estados de carga y error limpio, sin dependencias externas.
  * **Verificación:** Test unitario o comprobación de estado reactivo.
  * **Archivos:** `src/presentation/hooks/useMateriasPrimas.ts`.

- [ ] **Tarea 3: Componente `ListaMateriasPrimas` (UI Mobile-First)**
  * **Descripción:** Crear `src/presentation/components/ListaMateriasPrimas.tsx` respetando las reglas de diseño (cero cards sobre cards, badges claros de `OK` vs `REPONER` en `marca-tomate`, buscador simple).
  * **Criterio de Aceptación:** Renderizado fiel al manual de marca, legible en viewport de 375px.
  * **Verificación:** Compilación limpia y renderizado en `App.tsx`.
  * **Archivos:** `src/presentation/components/ListaMateriasPrimas.tsx`.

- [ ] **Tarea 4: Formulario y Modal `ModalNuevaMateriaPrima` con 5 Estados**
  * **Descripción:** Crear `src/presentation/components/ModalNuevaMateriaPrima.tsx` con inputs para nombre, unidad de medida (`g`, `ml`, `u`), costo y stocks, implementando explícitamente los 5 estados UI en cada campo interactivo.
  * **Criterio de Aceptación:** Navegabilidad por teclado (`Tab`, `Esc`), validaciones de campo y llamada a `crearMateriaPrima()`.
  * **Verificación:** Prueba de la mano atada e inspección visual.
  * **Archivos:** `src/presentation/components/ModalNuevaMateriaPrima.tsx`.

- [ ] **Tarea 5: Integración en `App.tsx` y Auditoría con DevTools**
  * **Descripción:** Conectar el listado y modal dentro de la solapa "Materias Primas" en `App.tsx`. El `@reviewer` audita con `chrome-devtools`, ejecuta `/sdd-archive` y genera `REPORTE_VERIFICACION_SDD.md`.
  * **Criterio de Aceptación:** Flujo de punta a punta funcional con persistencia en Supabase y reporte oficial de cierre.
  * **Verificación:** `/sdd-verify`, `npm run build`, `npm test` y generación de reporte.
  * **Archivos:** `src/App.tsx`, `REPORTE_VERIFICACION_SDD.md`.
