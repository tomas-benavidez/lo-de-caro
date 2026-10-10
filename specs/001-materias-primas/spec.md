# Especificación Funcional: Módulo de Materias Primas (Insumos)

- **Identificador:** `SPEC-001`
- **Módulo:** Materias Primas / Insumos
- **Estado:** Listo para Implementación

---

## 1. Objetivo y Contexto de Negocio
Permitir a Caro registrar, consultar y actualizar todas las materias primas e ingredientes que compra para la elaboración de sus comidas congeladas. El módulo calcula el costo unitario estándar (por gramo, mililitro o unidad) y alerta de forma visual cuando un ingrediente cae por debajo de su umbral mínimo de reposición.

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Listado de Materias Primas
* **Ubiquitous:** El sistema debe mostrar el listado completo de materias primas activas ordenadas alfabéticamente o por necesidad de reposición.
* **Criterio:** Cada ítem debe exhibir nombre, costo unitario formateado, stock actual con su unidad de medida y estado de inventario (`OK` o `REPONER`).

### RF-02: Alerta Visual de Reposición (Stock Mínimo)
* **State-driven:** Mientras el `stockActual` sea menor o igual al `stockMinimo`, el sistema debe resaltar el ítem con el distintivo visual `REPONER` en color `marca-tomate` (`#C13828`).

### RF-03: Alta de Materia Prima
* **Event-driven:** Cuando el usuario envía el formulario de nuevo insumo con datos válidos (`nombre`, `unidadMedida`, `costoUnitario`, `stockActual`, `stockMinimo`), el sistema debe persistir el registro en Supabase (`materias_primas`) y actualizar la lista en pantalla inmediatamente.

### RF-04: Validación y Manejo de Errores
* **Unwanted behavior:** Si el usuario intenta guardar un insumo sin nombre o con costo negativo, el sistema debe bloquear el envío y mostrar un mensaje de error accesible sin cerrar el formulario.

---

## 3. Requisitos de UI / UX & Accesibilidad
1. **Ergonomía Mobile-First:** Diseñado para teléfonos (pantallas de 360px a 420px), operable cómodamente con una sola mano en cocina.
2. **Anti-patrones Prohibidos:** Prohibido el uso de tarjetas anidadas (*cards sobre cards*), pastillas ilegibles con microtexto o íconos genéricos sin significado.
3. **5 Estados en Todo Control:** Cada botón, input y selector debe implementar: `Default`, `Hover`, `Active`, `Focus` (`:focus-visible` con anillo de alto contraste) y `Disabled`.
4. **Paleta de Marca:** Aplicación estricta de `marca-canela`, `marca-beige`, `marca-tomate` y tipografía Montserrat.
