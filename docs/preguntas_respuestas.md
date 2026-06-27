# Bitácora de Refinamiento y Entrevista - Sistema de Costos "La casa cocina"

Este documento registra las preguntas y respuestas que surgen durante la etapa de refinamiento de la idea y el problema a resolver.

---

## Hipótesis Inicial de la Idea
*   **Qué se quiere construir**: Un sistema para gestionar recetas, insumos, costos (fijos y variables, mermas, depreciación) y stock para un emprendimiento gastronómico familiar, automatizando cálculos que hoy resultan manuales y tediosos.
*   **Usuarios principales**: Tomás (propietario/operador del negocio "La casa cocina").
*   **Problema principal**: Pérdidas de dinero invisibles por mal cálculo de costos (especialmente mermas y falta de actualización en cascada cuando aumentan los insumos) y falta de control real de stock de materia prima.


---

## Historial de Preguntas y Respuestas

**Hipótesis de partida (17-06-2026):**
*   **HYPOTHESIS**: Querés construir un sistema de control de stock y costos gastronómicos para un negocio de pastas (rellenas y lisas), empanadas y tartas congeladas familiar. El sistema automatiza el costo total real de cada unidad (con recetas de carga directa usando Peso Limpio + % de Merma, y costos fijos por estimación fija mensual de producción), emite alertas de margen sin alterar precios autónomamente, y gestiona el stock en dos pasos con confirmación manual editable.
*   **CONFIDENCE**: 100% — La idea del producto y las reglas del problema a resolver están consolidadas.




---

**Pregunta 1:**
*   **Q**: Para calcular el costo total de un producto, necesitamos sumarle una parte de los costos fijos mensuales (alquiler, servicios, sueldo propio, depreciación). ¿Cómo preferís que el sistema asigne esta porción de costo fijo a cada receta/producto? ¿Usamos una estimación mensual fija de producción (ej. 500 unidades estimadas) para calcular un valor constante por unidad, o querés que se distribuya dinámicamente mes a mes según el volumen de producción real?
*   **GUESS**: Estimar un volumen mensual estándar de producción (ej. las 500 unidades que figuran en tu planilla de costos) y dividir el costo fijo total por ese volumen para obtener un "costo fijo unitario estándar". Si lo hiciéramos dinámico según la producción real de cada mes, el costo de una pastafrola cambiaría constantemente solo porque un mes cocinaste menos, lo que te obligaría a mover precios de venta de forma caótica y sin sentido comercial.
*   **Respuesta del cliente**: Tomás prefiere la estimación mensual fija porque no tiene sentido que el precio se ajuste todo el tiempo. Además, enfatiza que la aplicación debe dar advertencias/recomendaciones, pero **bajo ningún concepto debe modificar los precios de venta de manera autónoma**.

---

**Pregunta 2:**
*   **Q**: Cuando registrás la venta de un producto (ej. una pastafrola), ¿el sistema debería descontar directamente los ingredientes crudos del stock (manteca, azúcar, harina) en tiempo real según la receta, o preferís un flujo en el que primero registres que cocinaste un lote (ej. "hoy cociné 5 pastafrolas", lo cual descuenta los insumos y suma 5 tartas al stock) y luego las ventas simplemente descuenten el stock de tartas terminadas?
*   **GUESS**: Preferirás registrar explícitamente la producción de lotes. En pastelería, vos cocinás una tanda de productos para tener listos en el mostrador. Si descontamos los insumos en tiempo real con cada venta, se perdería el control de cuántas tartas tenés hechas físicamente y no podrías registrar fácilmente si un lote entero se echó a perder o se quemó en el horno antes de poder venderse (merma de producción).
*   **Respuesta del cliente**: Exacto. Primero se descuentan los insumos al registrar la producción del lote, y luego las ventas descuentan del stock de comida ya elaborada (aunque también debe ser posible vender lotes directamente).

---

**Pregunta 3:**
*   **Q**: En pastelería es muy común preparar bases que sirven para varios productos (ej. un lote de crema pastelera o una tanda grande de masa que guardás en la heladera). ¿El sistema debería permitir gestionar y llevar stock de estas "recetas base" intermedio (semielaborados) para usarlas luego en otras recetas, o preferís mantener las recetas directas y lineales (ej. que la receta de la pastafrola descuente harina, manteca y azúcar directamente de los insumos crudos, sin registrar stock intermedio de masa)?
*   **GUESS**: Al principio preferirás recetas directas y lineales. Aunque usar recetas base sea técnicamente más preciso, registrar el stock intermedio de masa en la heladera (y sus mermas individuales) requiere una disciplina de carga de datos diaria muy pesada para un negocio familiar. Desglosar los insumos crudos directamente en la receta de cada producto final suele ser mucho más ágil y fácil de mantener en el día a día.
*   **Respuesta del cliente**: El negocio es de comida congelada, no de pastelería. Se confirma que al principio usaremos recetas directas y lineales. Sin embargo, Tomás solicita que antes de confirmar el descuento de stock (tanto de insumos al producir como de comida congelada al vender) el sistema permita revisar y corregir manualmente los valores propuestos por si hay discrepancias con el stock real físico.

---

**Pregunta 4:**
*   **Q**: En comida congelada, la merma de ingredientes es súper crítica (por ejemplo, comprás 1 kg de carne cruda pero al cocinar y despostar te quedan 700 gramos limpios para armar las porciones congeladas). Al cargar una receta en el sistema, ¿cómo preferís indicar esta merma? ¿Querés ingresar por cada ingrediente el "Peso Bruto" (lo que comprás/descontás de stock) y el "Peso Limpio" (lo que realmente queda en la porción), o preferís ingresar el Peso Limpio y un "Porcentaje de Merma" estimado (ej. 30%)?
*   **GUESS**: Creo que te va a resultar más práctico ingresar el Peso Limpio y un Porcentaje de Merma por ingrediente. De esta manera, podés estandarizar la merma de los insumos (ej. sabés que la calabaza tiene 20% de merma) y el sistema calculará solo el costo financiero real y el descuento de stock de insumo bruto de forma automática, sin obligarte a calcular los gramos brutos a mano cada vez que diseñás un plato nuevo.
*   **Respuesta del cliente**: Tomás prefiere probar ingresando el **Peso Limpio** y el **Porcentaje de Merma** para ver el feedback con su cliente. Si no le sirve, se ajustará más adelante. Sirve como aprendizaje para futuros clientes de sistemas similares.

---

**Pregunta 5:**
*   **Q**: Para la calculadora de eventos o pedidos grandes, cuando el sistema genera la lista de compras de ingredientes consolidada (ej. necesitás producir 50 viandas de un plato), ¿debería restar automáticamente lo que ya tenés en stock en la alacena (lista de compras neta de faltantes), o preferís que calcule el total absoluto de la receta de cero para presupuestar y comprar el lote completo por separado?
*   **GUESS**: Creo que preferirás ver el total absoluto requerido por el evento. Para eventos grandes o catering, se suele ir a comprar mercadería fresca y cerrada específicamente para esa producción al mayorista, sin querer depender de si en la alacena del día a día te quedan fracciones de ingredientes (que tal vez necesitás para la producción normal).
*   **Respuesta del cliente**: Tomás prefiere que por defecto **sí reste del stock** de materia prima actual (lista neta). Sin embargo, quiere que exista la **opción** (un modo "evento" o "servicio") que permita calcular de cero ignorando el stock disponible, útil cuando el cliente final provee la materia prima o se quiere presupuestar todo de manera aislada.

---

## Declaración de Intención Confirmada
*   **Resultado Deseado (Outcome)**: Un sistema de stock y costos gastronómicos para un negocio de comida congelada que calcula costos unitarios reales, controla inventario en dos pasos (insumos a lote producido; lote producido a venta final) con confirmación editable previa, ofrece un resumen visual de ganancias reales y dispone de un módulo para registrar inversiones iniciales (equipamiento/compras de capital) que afecten la rentabilidad global.
*   **Usuario (User)**: Tomás y su cliente (emprendimiento familiar de comida congelada).
*   **Por qué ahora (Why now)**: Para profesionalizar el negocio en etapas tempranas de crecimiento, controlar el impacto de las inversiones iniciales de equipamiento en las ganancias, evitar pérdidas invisibles por mermas y simplificar el cálculo consolidado para pedidos grandes.
*   **Criterio de Éxito (Success)**: Que el usuario visualice sus márgenes netos reales por plato, registre compras de equipamiento y vea cómo impactan en su balance general de ganancias, reciba advertencias de aumentos sin que la app los aplique sola, y use la app cómodamente desde el celular.
*   **Restricciones (Constraints)**: Recetas puramente lineales y directas para simplificar la carga, costos fijos asignados en base a una estimación mensual fija de producción, modificación de precios 100% bajo control del usuario, y una interfaz de usuario diseñada de forma nativa como **Mobile-First** (prioridad del 80% de uso).
*   **Fuera de Alcance (Out of Scope)**: Gestión de stock de semielaborados (recetas anidadas en heladera), recalculación dinámica de costos fijos según la producción mensual real de cada mes, e integraciones o modificaciones autónomas de precios de venta en la base de datos.
*   **Aprobación final**: Tomás aprobó la Declaración de Intención el 17-06-2026.

---

# Fase de Diseño Lógico y Planificación

## 1. Modelado del Dominio (Entidades y Reglas de Negocio)

### Insumo (Materia Prima)
*   `nombre`: ej. "Lomo de Novillo", "Cebolla", "Bandeja Plástica".
*   `unidadMedida`: gramos (g), mililitros (ml) o unidades (u).
*   `costoBrutoUnitario`: Costo por unidad base ($/g, $/ml, $/u). Se calcula al ingresar una compra (ej. $10.000 por 5 kg de Harina -> $2/g).
*   `stockActual`: Stock en unidades base.
*   `stockMinimo`: Nivel para alertas de reabastecimiento.

### Receta (Fórmula de Elaboración)
*   `nombre`: ej. "Pastel de Papas Congelado".
*   `porcionesRendimiento`: Cuántas viandas individuales rinde la preparación base (ej. 10 viandas).
*   `ingredientes`: Lista de insumos vinculados con:
    *   `pesoLimpio`: Gramos/ml necesarios por porción.
    *   `porcentajeMerma`: Desperdicio estimado (ej. 30% en calabaza por pelado).
    *   *Cálculo del Peso Bruto Requerido*: `pesoLimpio / (1 - porcentajeMerma / 100)`.
    *   *Cálculo del Costo Financiero del Ingrediente*: `Peso Bruto Requerido * costoBrutoUnitario`.
*   `costoEnvase`: Costo del packaging unitario directo (ej. la bandeja del congelado).
*   `costoFijoProrrateado`: Costo fijo asignado por unidad (`Costos Fijos Totales / Estimación Producción Mensual`).
*   *Cálculo del Costo Total Unitario*: `(Suma de Costos de Ingredientes / porcionesRendimiento) + costoEnvase + costoFijoProrrateado`.

---

**Pregunta 7:**
*   **Q**: ¿Te parece correcto cómo calculamos el costo de un ingrediente en la receta aplicando la merma? Por ejemplo: si una vianda de calabaza lleva 200g limpios en el plato y la calabaza tiene 20% de merma, el sistema calcula que tenés que descontar 250g de calabaza cruda del stock (`200 / 0.8`), y financieramente te cobra esos 250g crudos sobre el costo del plato. ¿Es este el comportamiento que buscás?
*   **GUESS**: Creo que sí, porque es la forma exacta en que se recupera el dinero que se "pierde" en la bacha de lavado y pelado de verduras, sin falsear la cantidad real que ingresa al stock congelado.
*   **Respuesta del cliente**: Tomás prefiere crear un cuestionario no técnico para enviárselo directamente a su cliente final y que ella decida cómo operar en el día a día. Mientras ella responde, nosotros avanzamos con otras partes del planning y el diseño lógico. El cuestionario fue guardado en `docs/cuestionario_cliente_final.md`.

---

**Pregunta 8:**
*   **Q**: En la planilla teórica de costos, la depreciación del equipamiento (desgaste de heladeras, cocinas, hornos) se sumaba a los Costos Fijos mensuales. ¿Querés que cuando se registre una **Inversión** (ej. un freezer de $240.000 con 10 años de vida útil estimada), el sistema calcule automáticamente su desgaste mensual (ej. $2.000/mes) y lo sume a los costos fijos globales para ajustar el costo total de las viandas congeladas, o preferís que las depreciaciones se carguen fijas/manuales al igual que el alquiler o la luz?
*   **GUESS**: Lo ideal es que sea automático. Si el usuario carga el freezer nuevo en "Inversiones", ponerle el valor y los años de vida útil debería alimentar directamente la bolsa de costos fijos mensuales. Así, la app se encarga del cálculo contable de la depreciación de forma transparente y sin que el cliente tenga que hacer cuentas raras de amortización.
*   **Respuesta del cliente**: Tomás aprueba la idea de que la depreciación calculada de las inversiones se sume automáticamente a los costos fijos globales del sistema para tenerlo en cuenta de cara al costo de producción de cada plato, considerándolo una buena práctica.

---

**Pregunta 9:**
*   **Q**: Como el fuerte del negocio son pastas (rellenas y lisas), empanadas y tartas congeladas, las unidades de producción y venta varían (ej. cajas de 2 docenas de sorrentinos, docenas de empanadas, kilogramos de tallarines, o tartas enteras). ¿El sistema debería permitir que al crear una receta se defina libremente la "Unidad de Rendimiento" (ej. 1 caja, 1 docena, 1 kg, 1 unidad entera) y que el costeo y stock de productos terminados se calcule y descuente en base a esa unidad específica?
*   **GUESS**: Definitivamente sí. Si estandarizamos todo a una sola unidad (ej. solo por kilo o solo por porción individual), el usuario tendría que hacer molestas reglas de tres matemáticas cada vez que cocina o vende (como calcular cuánto pesa una empanada individual para cargarla al stock). Permitir elegir la unidad por receta mantiene el lenguaje real de la cocina.
*   **Respuesta del cliente**: Sí, Tomás confirma que al crear una receta o sumar un producto se debe elegir la unidad de venta (porción, unidad, docena, kilo, etc.). Además, aporta una regla clave para la calculadora: **el costo debe poder calcularse sobre una unidad base (ej. una sola empanada o un solo sorrentino) y luego el sistema debe multiplicarlo automáticamente según la unidad de venta final** (ej. multiplicar por 12 para la docena de empanadas, o multiplicar por 8 sorrentinos para conformar una porción).

---

**Pregunta 10:**
*   **Q**: Para que el flujo de venta sea ultra rápido desde el celular en el día a día, ¿qué datos mínimos debería ingresar el usuario al registrar una venta? ¿Te parece bien que solo seleccione el Producto, la Cantidad y el Precio de Venta Cobrado real (por si se hace un descuento en el momento), para que el sistema descuente el stock y guarde la ganancia neta real en el resumen?
*   **GUESS**: Sí, mantenerlo al mínimo es vital para que se use en el mostrador sin demoras. Permitir ingresar el "Precio Cobrado Real" en lugar de asumir siempre el precio de lista es fundamental en comercios de barrio, ya que permite registrar descuentos a amigos o promociones de último momento sin balance de caja desfasado.
*   **Respuesta del cliente**: Tomás aprueba la idea, pero añade una regla de negocio clave: **el sistema debe manejar el Estado de la Venta (Cobrado, Pendiente, etc.)**. Esto es porque muchas veces se entrega la mercadería (el stock se descuenta) pero el pago queda pendiente para más adelante.

---

**Pregunta 11:**
*   **Q**: Para las ventas que queden en estado "Pendiente", vas a necesitar saber quién te debe ese dinero. ¿Cómo preferís identificar a la persona? ¿Te sirve que la app tenga un campo de texto simple para escribir el nombre de la persona o una nota al paso (ej. "Juan de la esquina", "Marta vecina"), o preferís una sección formal de "Clientes" donde tengas que dar de alta a cada persona con su ficha completa de antemano?
*   **GUESS**: Creo que un campo de texto libre al registrar la venta es mil veces más rápido y cómodo para el celular. Tener que dar de alta una ficha de cliente completa antes de poder marcar una venta como "Pendiente" agregaría una traba molesta en el mostrador. Escribir el nombre en una sola línea es simple, ágil y soluciona el problema de raíz.
*   **Respuesta del cliente**: Tomás prefiere crear una **sección formal de Clientes** porque servirá para obtener estadísticas valiosas, como la recurrencia de compra (cuántos clientes nuevos compran y cuántos vuelven a comprar). Para mantener la agilidad mobile-first, **el único campo obligatorio será el Nombre y Apellido**, dejando otros datos (como teléfono) como opcionales.

---

## Fin de la Fase de Entrevista de Intenciones
Con la confirmación de la Pregunta 11, se han cerrado todas las definiciones lógicas y reglas de negocio del sistema. Se consolidó esta estructura en el documento de especificación formal de negocio en `docs/especificacion_negocio.md`.

---

# Fase de Diseño de Subagentes y Arquitectura Limpia

**Pregunta 15 (17-06-2026):**
*   **Q**: ¿Te parece que adoptemos una estructura de **Arquitectura Hexagonal** (`domain/`, `infrastructure/` y `presentation/`) como la base del proyecto y regla general compartida para todos los subagentes?
*   **GUESS**: Creo que sí, porque es el estándar de oro de las buenas prácticas. Te va a permitir ver con total claridad cómo se separa la matemática de la cocina (dominio) de la base de datos (infraestructura) y de las pantallas del celular (presentación), facilitando que cada subagente trabaje en su burbuja sin romper el trabajo del otro.
*   **Respuesta del cliente**: Tomás aprueba de forma entusiasta ir por el camino de la Arquitectura Hexagonal y expresa su deseo de ir aprendiendo los conceptos fundamentales a medida que avanzamos en el desarrollo del proyecto.

---

**Pregunta 16 (Diseño del Subagente de Backend):**
*   **Q**: Para las reglas del **Subagente de Backend**, necesitamos definir cómo se va a comunicar la pantalla de la aplicación con la base de datos de Supabase. ¿Querés que el frontend le pegue directamente a Supabase desde el navegador (aprovechando sus políticas de seguridad RLS), o preferís usar **Server Actions** (funciones de JavaScript que corren estrictamente en el servidor de Next.js y actúan como "controladores" o porteros que validan todo antes de tocar la base de datos)?
*   **GUESS**: Te recomiendo fuertemente usar **Server Actions**. En Arquitectura Limpia, el cliente (navegador) nunca debería hablar directo con la base de datos. Usar Server Actions nos permite crear una capa de servicios en el servidor que valida las reglas de negocio (ej. chequear mermas, verificar saldos deudores) antes de escribir en Supabase, aislando la base de datos del exterior y facilitando un montón el aprendizaje de cómo estructurar un backend real.
*   **Respuesta del cliente**: Tomás aprueba y confirma el uso de **Server Actions** para asegurar una comunicación estructurada y segura entre el cliente y el servidor.

---

**Pregunta 17 (Diseño del Subagente de Frontend):**
*   **Q**: Para las reglas del **Subagente de Frontend**, tenemos que decidir cómo va a manejar la aplicación la información en la pantalla del celular (el estado de los datos). ¿Querés que usemos un gestor de estado global complejo que viva en la memoria del teléfono (como Redux o Zustand), o preferís un enfoque híbrido moderno donde el servidor de Next.js renderice los datos frescos al instante tras cada cambio y la pantalla solo maneje estados locales simples y livianos (ej. el "carrito" temporal del mostrador antes de confirmar la venta)?
*   **GUESS**: Te recomiendo el enfoque híbrido y liviano. Cargar la memoria del celular con Redux o Zustand añade una complejidad de código enorme y ralentiza la app en teléfonos de gama media/baja (típicos dispositivos que se usan detrás del mostrador o en la cocina). Con Next.js App Router, el servidor renderiza los datos actualizados tras cada producción o venta, y el celular solo maneja lo mínimo indispensable en memoria, logrando una velocidad y fluidez espectaculares.
*   **Respuesta del cliente**: Tomás aprueba y confirma este enfoque híbrido. Aporta una regla de optimización fundamental: **limitar estrictamente el uso de `'use client'`**. Explotar la app con directivas de cliente es una mala práctica que infla el JavaScript descargado en el navegador de forma innecesaria. El subagente de Frontend debe diseñar componentes de servidor (RSC) por defecto, dejando `'use client'` únicamente para las hojas del árbol que requieran interactividad nativa del navegador.

---

**Pregunta 18 (Diseño del Subagente de Testing):**
*   **Q**: Para las reglas del **Subagente de Testing**, en un MVP gastronómico donde lo más importante es que las cuentas de dinero no fallen, ¿qué estrategia de pruebas preferís priorizar? Te recomiendo enfocarnos en el **Testing Unitario de la lógica de negocio (la capa de `domain`)** usando una herramienta rápida como Vitest. Esto significa escribir pruebas automáticas para comprobar que las fórmulas de mermas, el prorrateo de costos fijos, la depreciación y las docenas/porciones devuelvan números exactos en aislamiento, sin perder tiempo en testear la base de datos o la interfaz visual que van a estar cambiando constantemente en el mostrador.
*   **GUESS**: Apuesto a que vas a querer ir por acá. Ver en acción cómo la Arquitectura Hexagonal te permite probar que la matemática de "La casa cocina" dé perfecta en milisegundos, sin siquiera tener que levantar Supabase o abrir un navegador, es el mejor ejemplo práctico de por qué se usa este patrón de diseño en la industria.
*   **Respuesta del cliente**: Tomás aprueba y confirma el uso de **Vitest** en la capa de **Dominio** como la estrategia de testing del proyecto.

---

**Pregunta 19 (Diseño del Subagente de Auditoría / Code Review):**
*   **Q**: Para las reglas del **Subagente de Auditoría General**, su rol principal va a ser vigilar que no rompamos las reglas que estamos acordando para mantener el código limpio. ¿Te parece bien que su regla de oro sea actuar como un "auditor de fronteras de la Arquitectura Hexagonal", encargándose de rebotar cualquier código donde la capa de `domain` intente importar cosas de base de datos/Supabase, o donde el frontend intente saltearse el servidor, además de vigilar que no haya `'use client'` innecesarios?
*   **GUESS**: Sí, es la función perfecta para este rol. Al tener un subagente que actúe como un compilador de arquitectura rígido, te asegurás de que el código del proyecto se mantenga limpio y prolijo a largo plazo, enseñándote a no "hacer trampa" y a respetar las fronteras del software profesional.
*   **Respuesta del cliente**: Tomás aprueba y confirma este rol de guardián de fronteras para el subagente de **Auditoría / Code Review**.

---

## Fin de la Fase de Diseño de Subagentes
Todas las reglas operativas y el mapeo de **Skills Obligatorios** para cada subagente han sido cerrados y acordados. Se crearon los 4 archivos de definición y system prompt en la carpeta `docs/agentes/` incorporando este requerimiento:
*   **Subagente Backend**: Carga obligatoriamente `api-and-interface-design`, `security-and-hardening` y `source-driven-development`.
*   **Subagente Frontend**: Carga obligatoriamente `frontend-ui-engineering`, `source-driven-development` y `code-simplification`.
*   **Subagente Testing**: Carga obligatoriamente `test-driven-development` y `verification-before-completion`.
*   **Subagente Auditoría**: Carga obligatoriamente `code-review-and-quality`, `doubt-driven-development` y `code-simplification`.
