# Tareas de Implementación: Extensión de Materias Primas

- **Módulo:** SPEC-001.1
- **Regla:** Una sola tarea por iteración. Cada tarea implementada con `/boost` obligatorio y explicada con CÓMO, POR QUÉ y PARA QUÉ.

---

## Lista Atómica de Tareas

- [x] **Tarea 1: Migración DDL en Supabase y Extensión de Modelo en Dominio**
  * **Descripción:** Aplicar migración SQL en Supabase para reemplazar el constraint `materias_primas_unidad_medida_check` permitiendo `('g', 'ml', 'u', 'kg', 'l')`. Extender el tipo `UnidadMedida` en `src/domain/models/materiaPrima.ts` para incluir `'kg'` y `'l'`.
  * **Criterio de Aceptación:** Supabase acepta inserciones con `kg` y `l`. TypeScript valida sin errores los nuevos tipos.
  * **Verificación:** Ejecución de query de verificación en Supabase y compilación exitosa con `npm run build`.
  * **Archivos:** Supabase Migration / SQL, `src/domain/models/materiaPrima.ts`.

- [x] **Tarea 2: Métodos de Actualización y Eliminación en el Repositorio de Infraestructura**
  * **Descripción:** Incorporar los métodos `actualizar(id, datos)` y `eliminar(id)` en `src/infrastructure/repositories/materiaPrimaRepositorio.ts`. Agregar control del error Postgres `23503` (violación de clave foránea) para devolver mensaje claro si el insumo está vinculado a recetas.
  * **Criterio de Aceptación:** Métodos probados con tests unitarios simulando llamadas a Supabase con éxito y con fallo de clave foránea.
  * **Verificación:** `npm test` con nuevas aserciones en `tests/infrastructure/materiaPrimaRepositorio.test.ts`.
  * **Archivos:** `src/infrastructure/repositories/materiaPrimaRepositorio.ts`, `tests/infrastructure/materiaPrimaRepositorio.test.ts`.

- [x] **Tarea 3: Extensión del Hook de Aplicación `useMateriasPrimas`**
  * **Descripción:** Extender `src/presentation/hooks/useMateriasPrimas.ts` con `actualizarMateriaPrima(id, datos)` y `eliminarMateriaPrima(id)`. Mantener inmutabilidad del estado de `materiasPrimas` al editar o remover un elemento.
  * **Criterio de Aceptación:** Hook expone las funciones de mutación y actualiza reactivamente el estado local sin obligar a un refetch completo si la operación tuvo éxito.
  * **Verificación:** Compilación TypeScript estricta y prueba con `npm test`.
  * **Archivos:** `src/presentation/hooks/useMateriasPrimas.ts`.

- [x] **Tarea 4: Reutilización de Modal para Edición y Nuevas Unidades**
  * **Descripción:** Adaptar `src/presentation/components/ModalNuevaMateriaPrima.tsx` agregando la prop opcional `materiaPrimaAEditar?: MateriaPrima | null`. Si está presente, inicializar los campos con los valores existentes, ajustar el título a "Editar Materia Prima" y el botón a "Guardar Cambios". Agregar las opciones `kg` y `l` en el selector de unidad de medida.
  * **Criterio de Aceptación:** El modal sirve de forma transparente tanto para alta como para edición, respetando los 5 estados en cada control y validando que costo unitario y stock actual no sean negativos.
  * **Verificación:** Pruebas de render y compilación limpia con `npm run build`.
  * **Archivos:** `src/presentation/components/ModalNuevaMateriaPrima.tsx`.

- [x] **Tarea 5: Componente Accesible `ModalConfirmacion`**
  * **Descripción:** Implementar `src/presentation/components/ModalConfirmacion.tsx` para solicitar confirmación antes de eliminar. Debe implementar `role="dialog"`, `aria-modal="true"`, foco inicial en el botón "Cancelar", manejo de tecla `Escape` y botón de confirmación en variante `peligro`.
  * **Criterio de Aceptación:** Cumplimiento de pautas WCAG AA en modales de confirmación destructiva y respeto de los 5 estados UI.
  * **Verificación:** Navegación por teclado (foco y escape) y compilación limpia.
  * **Archivos:** `src/presentation/components/ModalConfirmacion.tsx`.

- [x] **Tarea 6: Acciones en `ListaMateriasPrimas` e Integración en `App.tsx`**
  * **Descripción:** Incorporar en cada fila de `src/presentation/components/ListaMateriasPrimas.tsx` los botones de "Editar" y "Eliminar". Conectar los eventos en `src/App.tsx` para abrir el modal de edición o el modal de confirmación de eliminación, llamando a los métodos del hook `useMateriasPrimas`.
  * **Criterio de Aceptación:** Desde la interfaz, Caro puede pulsar "Editar" para actualizar precio y stock, o pulsar "Eliminar" y confirmar para dar de baja el insumo.
  * **Verificación:** Ejecución de `npm run build` y prueba funcional manual.
  * **Archivos:** `src/presentation/components/ListaMateriasPrimas.tsx`, `src/App.tsx`.

- [x] **Tarea 7: Suite de Pruebas de Calidad y Cierre de Especificación**
  * **Descripción:** Ejecutar suite completa de tests unitarios, verificar cero errores de linter/TypeScript y validar la persistencia real contra Supabase.
  * **Criterio de Aceptación:** 100% de tests pasando en Vitest (`npm test`), build estático sin advertencias (`npm run build`).
  * **Verificación:** Ejecución de `npm test` y `npm run build`.
  * **Archivos:** `tests/`, `dist/`.
