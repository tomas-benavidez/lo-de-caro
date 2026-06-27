# Cuestionario de Validación de Requisitos - Sistema de Costos y Stock "Quinta Cocina"

Este documento tiene como objetivo validar el alcance, las reglas de negocio y las funcionalidades clave para el desarrollo del nuevo sistema de gestión de costos, recetas e inventario. 

Por favor, lea la propuesta de valor y responda a las preguntas del cuestionario al final para asegurar que la solución se adapte perfectamente a sus necesidades diarias de trabajo.

---

## 1. Propuesta de Valor y Funcionalidades Propuestas

El sistema está diseñado para simplificar el control de costos y stock, eliminando las planillas manuales y previniendo pérdidas de dinero invisibles. Los pilares del sistema son:

*   **Calculadora Gastronómica con Factor de Merma:** El sistema calcula el costo real de una receta basándose en el "peso limpio" de los ingredientes, pero cargando financieramente el costo bruto total del insumo (para que no pierda dinero con los desperdicios naturales de la cocina, como cáscaras, huesos o cocción).
*   **Actualización de Costos en Cascada:** Si el precio de un ingrediente básico (ej. harina, manteca) sube en el inventario, el sistema recalcula de forma automática e inmediata el costo de producción de todas las recetas y productos de venta que usen ese ingrediente.
*   **Independencia de Recetas y Productos:** Puede crear recetas base (ej. "Masa de Tarta") y luego usarlas para vender productos finales en diferentes formatos (ej. una porción, una tarta entera, o un combo).
*   **Costos Adicionales Claros:** Además de los ingredientes, podrá sumar costos de envases (packaging) y costos fijos de producción (gas, luz o mano de obra estimada) al costo total del producto.
*   **Alertas de Margen de Ganancia:** Si el costo de los insumos sube y hace que su ganancia real baje de su objetivo, el sistema le alertará y le sugerirá un nuevo precio de venta, pero usted decidirá cuándo aplicarlo al cliente.
*   **Control Inteligente de Stock:** El stock de ingredientes se descontará de forma automática con cada venta registrada según la receta asociada. También contará con la opción de registrar mermas o pérdidas extraordinarias (ej. "se quemó una tarta" o "se venció un lácteo").
*   **Asistente para Eventos / Pedidos Grandes:** Podrá ingresar un pedido grande (ej. un catering para 50 personas) y el sistema calculará al instante cuántos ingredientes necesita comprar y cuánto le costará producirlo.

---

## 2. Cuestionario de Validación para el Cliente

Por favor, responda a las siguientes preguntas seleccionando la opción que mejor se adapte a su forma de trabajo o detallando su respuesta en el espacio provisto.

### A. Gestión de Insumos y Unidades de Medida
Para evitar errores matemáticos complejos, proponemos registrar todos los insumos usando unidades base estándar (gramos para sólidos, mililitros para líquidos, y unidades para ítems individuales).
*   *Ejemplo: Si compra una bolsa de 5 kg de harina, se registrará en el stock como 5000 gramos.*
1. **¿Le resulta cómodo trabajar las recetas e insumos en gramos y mililitros para estandarizar el sistema?**
   *   [x ] Sí, es la forma más precisa y prefiero trabajar así.
   *   [ ] No, prefiero poder ingresar recetas en cucharadas, tazas u otras medidas (tenga en cuenta que esto requiere definir equivalencias para cada ingrediente).
   *   *Comentarios:* __________________________________________________________________

### B. Control de Márgenes y Precios de Venta
Cuando un ingrediente sube de precio, el costo de producción del producto final se eleva, reduciendo su margen de ganancia real.
2. **¿Cómo prefiere que reaccione el sistema ante estas subas de costos?**
   *   [ x] Que el sistema me muestre una alerta visual con el margen real afectado y me sugiera el nuevo precio de venta, pero que me permita decidir a mí cuándo actualizarlo formalmente.
   *   [ ] Que el sistema actualice automáticamente el precio de venta sugerido al público basándose en el porcentaje de ganancia objetivo establecido.
   *   [ ] Solo quiero ver los costos actualizados en los reportes sin sugerencias ni alertas de precios.

### C. Costos No Comestibles (Packaging y Gastos de Producción)
El costo de un producto no es solo la comida; también incluye la caja, la bolsa, etiquetas y la energía utilizada.
3. **¿Qué tipos de costos adicionales le gustaría poder cargar en sus productos? (Puede marcar varias opciones)**
   *   [x ] Envases y empaques específicos (cajas, bolsas de entrega, papel film, etiquetas).
   *   [x ] Costos fijos estimados de producción por tanda/lote (gas, electricidad, agua).
   *   [ ] Costo de mano de obra estimada por receta.
   *   [ ] Otro (especificar): __________________________________________________________

### D. Control de Inventario y Desperdicios
El sistema puede descontar insumos de forma automática al registrar una venta. Sin embargo, en la cocina hay mermas del día a día (ingredientes que se vencen, platos que salen mal).
4. **¿Desea poder registrar manualmente estas pérdidas extraordinarias para mantener el stock real al día?**
   *   [x ] Sí, es fundamental registrar las pérdidas y desperdicios para saber exactamente qué se perdió y por qué.
   *   [ ] No, con el descuento automático de ventas y un ajuste de stock mensual manual es suficiente.

### E. Pedidos Especiales y Catering
5. **¿Realiza ventas de pedidos grandes, eventos o catering que requieran planificar compras de ingredientes con anticipación?**
   *   [ x] Sí, a menudo hago eventos o pedidos grandes y me serviría que el sistema sume las recetas y me genere una lista de compras consolidada.
   *   [ ] No, vendo principalmente productos individuales de mi menú diario.

### F. Prioridades de Lanzamiento
6. **De las funciones mencionadas, ¿cuáles considera críticas para el primer día de uso y cuáles podrían esperar a una segunda etapa?**
   *   *Críticas (Esenciales):* principalmente tener registro de los gastos y el stock de productos, sacar bien el costo y saber las ganancia. 
   *   *Secundarias (Deseables):* 
tambien llevar registro de los clientes, calculadora de costos



