# Feature: Ajuste Manual de Stock de Congelados en Producción (SPEC-003.1)

- **Archivo fuente:** `specs/003-produccion-stock/tasks-003.1.md`
- **Identificador:** `SPEC-003.1`
- **Ruta de implementación:** delegated direct (con subagentes SDD)
- **TDD:** Pruebas unitarias con Vitest
- **Runner:** `npm test`

## Objetivo y Contexto de Negocio
Permitir a Caro registrar salidas o correcciones del stock de freezer (consumo personal, degustaciones/regalos a clientes, mermas/roturas, o conteos físicos) sin alterar las materias primas en la alacena, garantizando la fidelidad del inventario de platos terminados.

## Alcance Autorizado
1. Extensión de modelos de dominio (`MotivoAjusteStock`, `AjusteStockProductoInput` en `src/domain/models/producto.ts`).
2. Método `ajustarStock` en `ProductoRepositorio` con validación de valores no negativos y verificación de que materias primas queden inalteradas.
3. Tests unitarios en `tests/infrastructure/productoRepositorio.test.ts`.
4. Extensión del hook `useProductosRecetas.ts` con `ajustarStockProducto`.
5. Creación del componente accesible `ModalAjusteStockProducto.tsx` con los 5 estados obligatorios de UI.
6. Integración del botón "Ajustar Stock" en `ListaProduccion.tsx` y conexión en `App.tsx`.
7. Verificación completa con `npm test`, `npm run build` y Chrome DevTools, actualizando `REPORTE_VERIFICACION_SDD.md`.

## Tareas

- [x] `TASK-01`: Modelos de dominio (`MotivoAjusteStock`, `AjusteStockProductoInput` en `producto.ts`) y especificaciones
- [x] `TASK-02`: Método `ajustarStock` en `ProductoRepositorio` con pruebas unitarias TDD
- [x] `TASK-03`: Extensión del hook `useProductosRecetas` con `ajustarStockProducto`
- [x] `TASK-04`: Creación del componente modal `ModalAjusteStockProducto.tsx` (accesible, mobile-first, 5 estados)
- [x] `TASK-05`: Botón "Ajustar Stock" en `ListaProduccion.tsx` e integración en `App.tsx`
- [x] `TASK-06`: Verificación integral en caliente, suite Vitest, build y actualización de `REPORTE_VERIFICACION_SDD.md`

