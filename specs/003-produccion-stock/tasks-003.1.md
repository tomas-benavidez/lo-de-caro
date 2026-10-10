# Tareas de Implementación: Ajuste Manual de Stock de Congelados (SPEC-003.1)

- **Módulo:** SPEC-003.1
- **Regla:** Cada tarea explicada con CÓMO, POR QUÉ y PARA QUÉ.

---

## Lista Atómica de Tareas

- [x] **Tarea 1: Extensión del Modelo de Dominio de Productos**
  * **Descripción:** Agregar `MotivoAjusteStock` y `AjusteStockProductoInput` a `src/domain/models/producto.ts`.
  * **Criterio de Aceptación:** Tipos exportados y utilizables sin errores de TypeScript.
  * **Archivos:** `src/domain/models/producto.ts`.

- [x] **Tarea 2: Método `ajustarStock` en Repositorio de Infraestructura (TDD)**
  * **Descripción:** Implementar `ajustarStock(id, input)` en `src/infrastructure/repositories/productoRepositorio.ts`. Validar no negatividad de stock, validar motivo y actualizar únicamente la tabla `productos` sin afectar `materias_primas`.
  * **Criterio de Aceptación:** Tests en `tests/infrastructure/productoRepositorio.test.ts` pasando al 100%.
  * **Archivos:** `src/infrastructure/repositories/productoRepositorio.ts`, `tests/infrastructure/productoRepositorio.test.ts`.

- [x] **Tarea 3: Extensión del Hook `useProductosRecetas`**
  * **Descripción:** Agregar método `ajustarStockProducto(id, input)` en `src/presentation/hooks/useProductosRecetas.ts`. Actualizar reactivamente la lista local inmutable de productos.
  * **Criterio de Aceptación:** Hook expone la función y refleja cambios en el estado local.
  * **Archivos:** `src/presentation/hooks/useProductosRecetas.ts`.

- [x] **Tarea 4: Componente Accesible `ModalAjusteStockProducto`**
  * **Descripción:** Crear `src/presentation/components/ModalAjusteStockProducto.tsx` con soporte de 5 estados en cada control, accesibilidad WCAG AA, tecla `Escape`, foco inicial, selector de motivo y aviso visual de no afección a materias primas.
  * **Criterio de Aceptación:** Renderizado mobile-first, cálculo visual de diferencia y validaciones.
  * **Archivos:** `src/presentation/components/ModalAjusteStockProducto.tsx`.

- [x] **Tarea 5: Botón "Ajustar Stock" en `ListaProduccion` e Integración en `App.tsx`**
  * **Descripción:** Agregar botón interactivo en cada tarjeta de producto de `ListaProduccion.tsx`. Conectar evento en `App.tsx` para abrir y procesar el ajuste.
  * **Criterio de Aceptación:** Caro puede tocar "Ajustar Stock", modificar la cantidad, elegir motivo y ver la actualización inmediata en el freezer.
  * **Archivos:** `src/presentation/components/ListaProduccion.tsx`, `src/App.tsx`.

- [x] **Tarea 6: Verificación Integral, DevTools y Reporte Final**
  * **Descripción:** Ejecutar suite completa con `npm test`, compilar con `npm run build`, auditar en caliente con Chrome DevTools y generar el reporte en `REPORTE_VERIFICACION_SDD.md`.
  * **Criterio de Aceptación:** 0 errores de consola, tests pasando, build exitoso y reporte actualizado.
  * **Archivos:** `REPORTE_VERIFICACION_SDD.md`.

