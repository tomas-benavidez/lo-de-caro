# Especificación Funcional y Técnica: Extensión de Materias Primas (Unidades 'kg'/'l', Edición y Baja Accesible)

- **Identificador:** `SPEC-001.1`
- **Módulo:** Materias Primas / Insumos
- **Estado:** Listo para Implementación
- **Depende de:** `SPEC-001` (Implementación base de materias primas)

---

## 1. Objetivo y Contexto de Negocio

En la operatoria gastronómica real de Caro, muchos insumos se compran y almacenan al por mayor (ej. bolsas de harina en kilogramos `kg`, o aceite/leche en litros `l`). Forzar la conversión mental inmediata a gramos o mililitros durante la compra genera fricción innecesaria. 

Asimismo, los precios de los insumos fluctúan frecuentemente por inflación y el stock físico requiere ajustes manuales de inventario (auditoría visual de alacena/heladera). Finalmente, insumos cargados por error o discontinuados deben poder eliminarse de forma segura sin romper la integridad con recetas.

Esta especificación extiende `SPEC-001` incorporando:
1. Soporte directo de unidades `kg` (kilogramos) y `l` (litros) junto con las existentes `g`, `ml`, `u`.
2. Edición de insumos existentes: actualización de costo unitario y ajuste manual de stock actual.
3. Eliminación de materias primas con confirmación accesible y control de integridad referencial.

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Soporte de Unidades 'kg' y 'l'
* **Ubiquitous:** El sistema debe soportar como unidades de medida válidas: gramos (`g`), kilogramos (`kg`), mililitros (`ml`), litros (`l`) y unidades (`u`).
* **Criterio:** El usuario puede seleccionar cualquiera de estas unidades al crear o editar una materia prima. El costo unitario se expresará y formateará en función de la unidad seleccionada (ej. `$ 1.500,00 por kg`). No se realizan conversiones forzadas en este módulo (Filosofía YAGNI: se registra y opera en la unidad de compra/control elegida).

### RF-02: Edición de Materia Prima y Ajuste Manual de Stock
* **Event-driven:** Cuando el usuario selecciona la acción de editar sobre una materia prima en el listado, el sistema debe abrir el formulario precargado con los datos actuales del insumo.
* **Criterio:** El usuario puede modificar el costo unitario (reflejando compras con nuevo precio) y realizar un ajuste manual del stock actual (ej. corrección tras recuento físico). Al guardar datos válidos, los cambios se persisten en Supabase y la lista se actualiza inmediatamente sin recargar la página.

### RF-03: Eliminación con Confirmación Accesible
* **Event-driven:** Cuando el usuario pulsa la acción de eliminar sobre una materia prima, el sistema debe solicitar confirmación explícita a través de un diálogo modal accesible antes de ejecutar cualquier borrado.
* **Criterio:** El diálogo debe advertir claramente el nombre del insumo a eliminar. Contará con botones de "Cancelar" y "Eliminar definitivamente" (color `marca-tomate`).
* **Unwanted behavior:** Si la materia prima está asociada como ingrediente en alguna receta (`receta_ingredientes`), la base de datos rechazará la eliminación por restricción de clave foránea (`ON DELETE RESTRICT`). El sistema debe capturar el error y mostrar un mensaje accesible: *"No se puede eliminar la materia prima porque está siendo utilizada en una o más recetas."*

### RF-04: Validación y Manejo de Errores en Edición
* **Unwanted behavior:** Si el usuario ingresa un costo unitario negativo, stock negativo o deja el nombre vacío durante la edición, el formulario debe bloquear el envío y exhibir el mensaje de error correspondiente con contraste adecuado.

---

## 3. Impacto en Base de Datos (Supabase PostgreSQL)

### Verificación del Constraint Actual
En la tabla `materias_primas`, el constraint `materias_primas_unidad_medida_check` actual está restringido a:
```sql
CHECK (unidad_medida IN ('g', 'ml', 'u'))
```

### Migración DDL Requerida
Se debe actualizar el constraint para incluir `'kg'` y `'l'`:
```sql
ALTER TABLE materias_primas DROP CONSTRAINT IF EXISTS materias_primas_unidad_medida_check;

ALTER TABLE materias_primas ADD CONSTRAINT materias_primas_unidad_medida_check 
  CHECK (unidad_medida IN ('g', 'ml', 'u', 'kg', 'l'));
```

### Integridad Referencial
La tabla `receta_ingredientes` ya posee la restricción:
```sql
FOREIGN KEY (materia_prima_id) REFERENCES materias_primas(id) ON DELETE RESTRICT
```
Esto garantiza que ninguna materia prima en uso pueda quedar huérfana en recetas existentes. El backend devolverá el código de error `23503` (foreign_key_violation) que será manejado en la capa de infraestructura.

---

## 4. Diseño de UI / UX & Accesibilidad (WCAG AA & Ponytail)

1. **Reutilización del Modal Existente (Ponytail):**
   * En lugar de crear un modal duplicado para edición, se adapta `ModalNuevaMateriaPrima` (o generalizado como `ModalMateriaPrima`) recibiendo una propiedad opcional `materiaPrimaAEditar?: MateriaPrima | null`.
   * Si existe `materiaPrimaAEditar`, el título del modal es *"Editar Materia Prima"*, los campos se inicializan con sus valores actuales y el botón de acción principal muestra *"Guardar Cambios"*.
   * Si es nulo, opera en modo *"Nueva Materia Prima"*.

2. **Acciones en la Fila de la Lista:**
   * En cada elemento de `ListaMateriasPrimas`, se añaden botones accesibles:
     * Botón **Editar**: Con ícono/texto claro y etiqueta `aria-label="Editar [nombre del insumo]"`.
     * Botón **Eliminar**: Variante peligro, con etiqueta `aria-label="Eliminar [nombre del insumo]"`.
   * Zona de toque mínima de 44x44px para dedos en pantalla táctil de cocina.

3. **Diálogo de Confirmación Accesible (`ConfirmarEliminacionModal`):**
   * Implementa `role="dialog"`, `aria-modal="true"`, `aria-labelledby` y `aria-describedby`.
   * Captura y gestión de foco: al abrirse, el foco se posiciona en el botón "Cancelar" para prevenir eliminaciones accidentales.
   * Soporte de tecla `Escape` para cancelar y cerrar.
   * Los 5 estados de control obligatorios (`Default`, `Hover`, `Active`, `Focus`, `Disabled`) implementados con `Boton` y Tailwind.

4. **Paleta y Tipografía:**
   * Botón de confirmación destructiva en `marca-tomate` (`#C13828`).
   * Tipografía Montserrat, bordes suaves y fondo `marca-beige` / neutros estándar.

---

## 5. Diseño Arquitectónico (Clean Architecture)

```
[ UI React Mobile-First: ListaMateriasPrimas + ModalMateriaPrima + ModalConfirmacion ]
                                      │
                                      ▼
[ Custom Hook: useMateriasPrimas (actualizar, eliminar) ] ──► (Application Layer)
                                      │
                                      ▼
[ Repositorio: materiaPrimaRepositorio (actualizar, eliminar) ] ──► (Infrastructure Layer)
                                      │
                                      ▼
[ Supabase PostgreSQL (materias_primas) ] ──► (Database con nuevo CHECK)
```

### Capa de Dominio (`src/domain/`)
* `src/domain/models/materiaPrima.ts`:
  * Extender `UnidadMedida`: `'g' | 'ml' | 'u' | 'kg' | 'l'`.

### Capa de Infraestructura (`src/infrastructure/`)
* `src/infrastructure/repositories/materiaPrimaRepositorio.ts`:
  * Método `actualizar(id: string, datos: ActualizarMateriaPrimaInput): Promise<MateriaPrima>`.
  * Método `eliminar(id: string): Promise<void>`.
  * Mapeo de errores relacionales (captura de error `23503` con mensaje amigable de dominio).

### Capa de Presentación (`src/presentation/`)
* `src/presentation/hooks/useMateriasPrimas.ts`:
  * `actualizarMateriaPrima(id: string, datos: ActualizarMateriaPrimaInput): Promise<MateriaPrima>`.
  * `eliminarMateriaPrima(id: string): Promise<void>`.
  * Actualización inmutable de la lista local de materias primas.
* `src/presentation/components/ModalNuevaMateriaPrima.tsx`:
  * Incorporación de `'kg'` y `'l'` en el selector de unidad.
  * Soporte de modo edición precargado.
* `src/presentation/components/ModalConfirmacion.tsx`:
  * Componente modal liviano y accesible para confirmación de acciones destructivas.
* `src/presentation/components/ListaMateriasPrimas.tsx`:
  * Botones de acción "Editar" y "Eliminar" en cada ítem.
* `src/App.tsx`:
  * Coordinación de estados para abrir modal de edición y modal de confirmación de eliminación.

---

## 6. Criterios de Aceptación (DoD)

1. **Unidades:** El usuario puede seleccionar `kg` o `l` al crear o editar, y se almacena exitosamente en Supabase sin errores de constraint.
2. **Edición:** El usuario puede modificar el costo unitario y ajustar el stock actual de un insumo existente; los cambios se reflejan inmediatamente en la UI y en la base de datos.
3. **Baja Segura:** El usuario solo puede eliminar un insumo tras confirmar en el diálogo accesible.
4. **Protección de Recetas:** Si la materia prima tiene recetas asociadas, la eliminación es rechazada con un mensaje claro y amigable sin romper la aplicación.
5. **Calidad y Tests:**
   * Pruebas unitarias de repositorio cubriendo actualización y eliminación (éxito y error FK).
   * Cero errores de TypeScript (`npm run build`).
   * Pruebas automatizadas con Vitest ejecutadas con éxito (`npm test`).
