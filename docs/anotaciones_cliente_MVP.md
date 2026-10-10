# Anotaciones del Cliente - Alcance y Requisitos del MVP

Documento destinado a registrar textualmente las notas, comentarios y requerimientos transmitidos por el cliente para el MVP de "Lo de Caro".

---

## 1. Registro Textual del Cliente (Audio / Dictado)

> "necesito que haya solapas de cada prodcuto en donde yo puedo determinar o estandarizar la receta y que me permita tenes los costos por porcion y que a su vez yo pueda ir cargando la cantidad de producto que vaya produciendo y asi ir viendo la materia prima que voy usando, tambien necesito una solapa de materia prima en donde esten los costos de cada una y que esta vinculado a las recetas y cantidades, para asi poder ir produciendo teniendo costos y viendo cuanta materia prima me quedarian, que serian alertas de un minimo de materia prima, y asi poder ver mes a mes que costos tuvieron las materias primas y ver que ganacia le saco a cada producto para saber si el precio de venta es el correcto, en base a eso y los costos saber ganancias de cada uno, tambien quisiera tener una solapa en donde yo determine una cantidad de ganancia mensual y tener un objetivo de venta para poder lograrla, osea cantidad de productos como ejemplo que deberia vender para llegar a un X cantidad de ganancia"

---

## 2. Desglose Estructurado de Requisitos

A partir de lo expresado por Caro, el alcance real que ella necesita para el MVP abarca 5 pilares funcionales:

### A. Estandarización de Recetas y Costo por Porción
* Definición de ingredientes y cantidades por receta de cada producto.
* Cálculo automático del costo de producción por porción / unidad base a partir de los costos de sus ingredientes.

### B. Gestión e Inventario de Materia Prima (Insumos)
* Catálogo de materias primas con su costo unitario actualizado.
* Vinculación directa con las recetas.
* Stock remanente de materia prima con alertas visuales de stock mínimo (reabastecimiento).

### C. Registro de Producción con Descuento de Insumos
* Carga de lotes producidos (ej. "cociné 20 porciones de sorrentinos").
* Consumo y descuento automático de las materias primas utilizadas según la receta.
* Aumento del stock de producto terminado listo para la venta.

### D. Análisis de Rentabilidad y Precios
* Comparación histórica y mensual: Costo real de materia prima vs. Precio de venta al público.
* Visualización del margen de ganancia real por producto para validar si el precio de lista es el adecuado.

### E. Planificador de Metas y Calculadora de Ventas
* Definición de una meta de ganancia neta mensual deseada (ej. los $300.000 que figuraban en la hoja `Resumen Meses` del Excel).
* Proyección de volumen: cálculo de cuántas unidades/productos necesita vender para alcanzar ese objetivo financiero.

### F. Solapa y Módulo de Gastos (Libro Diario y Compras)
* Solapa explícita **Gastos** en la navegación principal.
* Registro de egresos por fecha, concepto, monto y categoría (`Materia Prima`, `Packaging`, `Servicios`, `Equipamiento`, `Otros`).
* **Vínculo directo con Materia Prima:** Si el gasto es compra de ingrediente, debe permitir seleccionar el insumo para incrementar automáticamente su stock y actualizar su costo de compra.
* Alimenta el módulo de **Finanzas**: `Ganancia Neta = Ventas Cobradas - Gastos Totales`.
