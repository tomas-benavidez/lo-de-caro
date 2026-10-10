# Convenciones de Código y Estilo - "Lo de Caro"

Este documento contiene las reglas de estilo de código, nomenclatura y calidad que deben respetar todos los desarrolladores y agentes en el proyecto.

---

## 1. Nomenclatura en Español Estricto (Lenguaje del Dominio)
Para mantener coherencia con el negocio gastronómico de Caro:
* **Entidades y Modelos:** PascalCase en español (`MateriaPrima`, `Producto`, `LoteProduccion`, `RecetaIngrediente`, `Venta`, `Cliente`, `Gasto`).
* **Variables y Propiedades:** camelCase en español (`costoUnitario`, `stockActual`, `stockMinimo`, `precioLista`, `unidadMedida`, `estadoPago`).
* **Funciones y Métodos:** Verbo en infinitivo + sustantivo en camelCase (`calcularCostoPorcion`, `registrarProduccion`, `obtenerVentasDelMes`, `validarStockDisponible`).
* **Componentes UI:** PascalCase descriptivo (`BotonPrincipal`, `TarjetaProducto`, `ModalNuevoLote`, `SelectorCantidad`).
* **Tablas de Base de Datos:** snake_case en español plural (`materias_primas`, `productos`, `receta_ingredientes`, `lotes_produccion`, `ventas`, `venta_items`, `clientes`, `gastos`).

---

## 2. Principios de Clean Code & Arquitectura Limpia
* **Separación de Capas:**
  * `domain/`: Contiene la matemática pura (fórmulas de recetas, costos, márgenes). No sabe nada de React, Tailwind ni Supabase.
  * `application/`: Casos de uso que orquestan operaciones (ej. "cuando se cocina un lote, validar stock y preparar actualización").
  * `infrastructure/`: Habla con Supabase y las APIs externas.
  * `presentation/`: Solo renderiza la interfaz y escucha eventos del usuario.
* **Tipado Estricto:** Prohibido el uso de `any` en TypeScript. Usar interfaces explícitas o `unknown` con validación Zod.
* **Funciones Cortas:** Máximo 20-30 líneas por función. Si hace más de una cosa, se divide.

---

## 3. Obligación de los 5 Estados en UI (Accesibilidad y UX)
Todo elemento interactivo debe implementar:
1. `Default`
2. `Hover`
3. `Active`
4. `Focus` (`:focus-visible` con anillo de contraste alto, 100% operable por teclado)
5. `Disabled`

---

## 4. Filosofía Ponytail (YAGNI & Antirregresiones)
* No instalar paquetes npm para problemas que se resuelven con 3 líneas de JavaScript estándar.
* No crear abstracciones especulativas "por si acaso".
* Resolver cada tarea con el código más corto, directo y legible posible.

---

## 5. Anti-patrones Visuales y Recursos Propios (UI Auténtica)
* **Cero "Cards sobre Cards":** No anidar tarjetas visuales sin justificación.
* **Cero Pills con texto minúsculo:** Evitar badges o pastillas sobrecargadas que ensucien la pantalla del celular.
* **Cero Iconos Genéricos:** La información se comunica con tipografía clara y datos legibles, no con spam de íconos.
* **Identidad Propia:** Usar los recursos visuales reales disponibles en `public/` (`logos/`, `backgrounds/`, `personajes/`).
* **Lógica primero:** La app es una herramienta de cocina/mostrador. La estabilidad, la rapidez y los cálculos exactos están siempre por encima de cualquier adorno cosmético.

