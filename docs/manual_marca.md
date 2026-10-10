# Manual de Marca — LO DE CARO

## 1. Definición y Concepto
**LO DE CARO** es una propuesta de comida casera freezada, real y transparente, diseñada para simplificar el día a día sin sacrificar nutrición ni sabor.

* **El problema que resuelve:** Comer bien cuando no sobra tiempo y el cansancio apura.
* **Qué no es:** No son ultraprocesados ni comida rápida sin alma.
* **Qué es:** La evolución de la cocina casera tradicional. Tartas abundantes, empanadas bien rellenas, pastas artesanales y salsas con tiempo de elaboración, congeladas en su punto justo para mantener intactos su sabor, frescura y nutrientes.
* **Transparencia total:** Lo que ves es lo que hay. Sin secretos ni ingredientes raros, con la honestidad de la comida hecha en casa. Abrís el freezer, elegís tu plato, le das el toque final (al horno o a la olla) y disfrutás.

---

## 2. Propósito de Marca
> Aliviar el estrés del *«¿qué comemos hoy?»*, ofreciendo alimentos verdaderos que cuidan el bienestar y el tiempo de las personas.

---

## 3. Tono y Voz de la Marca

### Arquetipo / Voz
La voz de **LO DE CARO** es como esa amiga o vecina que cocina increíble: práctica, que no te complica la vida y te habla con total honestidad.

### Personalidad y Pilares de Comunicación
* **Cercana y cálida:** Habla de igual a igual, de manera directa, familiar y cotidiana.
* **Honesta y transparente:** Muestra los ingredientes con orgullo. Sin vueltas ni exageraciones innecesarias; la calidad de la comida habla por sí sola.
* **Práctica y resolutiva:** Transmite alivio, solución y tranquilidad. Hace que la rutina se sienta más liviana.
* **Apetitosa y casera:** Apela a lo sensorial, al aroma de la comida recién hecha y al disfrute de comer rico sin esfuerzo.

---

## 4. Tipografías

| Uso / Jerarquía | Familia Tipográfica |
| :--- | :--- |
| **Titulares principales** | Berlinsans |
| **Otros títulos / Subtítulos** | Bumbbled |
| **Textos y párrafos (Cuerpo)** | Montserrat (Family) |

---

## 5. Paleta de Colores

### Color de Logotipo
* **Tonalidad:** Beige Base
* **HEX:** `#F8F7E1`
* **RGB:** `rgb(255, 255, 230)`
* **CMYK:** `C: 0% | M: 0% | Y: 10% | K: 0%`

### Colores del Sistema / Marca

| Nombre del Color | HEX | Muestra / Descripción |
| :--- | :--- | :--- |
| **Madera de canela** | `#A6613A` | Marrón cálido y terroso |
| **Beige** | `#F8F7E1` | Tono claro de fondo / logotipo |
| **Mermelada de tomate** | `#C13828` | Rojo intenso y apetitoso |
| **Hoja de otoño** | `#E56B31` | Naranja cálido y enérgico |
| **Crema de lima** | `#C0D873` | Verde suave y fresco |

---

## 6. Lineamientos de UI & Anti-patrones Visuales (Reglas Mandatorias)

Para garantizar que la aplicación mantenga una estética limpia, auténtica y fiel a la marca de Caro (sin caer en vicios de interfaces genéricas de IA):

### Reglas Estrictas de Diseño:
1. **NO a "Cards sobre Cards":** Prohibido el anidamiento visual excesivo de tarjetas dentro de tarjetas. Usar listas limpias, divisores sutiles y espacios en blanco generosos.
2. **NO a Pills / Badges con texto sobrecargado:** Evitar pastillas pequeñas con micro-textos o estados redundantes que ensucien la visual.
3. **NO a Iconos Genéricos sin propósito:** No llenar la pantalla de íconos decorativos o abstractos. La interfaz debe priorizar tipografía clara y datos legibles.
4. **Uso de Recursos Oficiales (`public/`):**
   * Logos oficiales en SVG/PNG (`public/logos/png rojo.svg`, `png beige.svg`, `png negro.svg`).
   * Fondos de marca (`public/backgrounds/back_mobile_*.png`, `back_desktop_*.png`).
   * Ilustraciones de identidad (`public/personajes/personaje_principal.png` y vectores).
5. **Prioridad: Lógica y Robustez sobre Adornos:** La interfaz es una herramienta de trabajo para la cocina y el mostrador. Primero debe funcionar perfecto, no romperse y responder al instante; los ornamentos cosméticos no deben entorpecer la carga rápida ni el registro de operaciones.