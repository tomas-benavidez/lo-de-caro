# Especificación de Diseño Visual — Obrador Digital "Lo de Caro"

> **Documento Fuente de Verificación Estética:** Extraído directamente del proyecto oficial de Stitch: **`projects/12214678904456776125` ("Diseño Visual Web de Marca")**.  
> **Propósito:** Servir como guía canónica e inmutable de diseño visual tanto para escritorio (**Desktop**) como para celular (**Mobile**), permitiendo a cualquier agente o desarrollador trasladar fielmente la estética sin alterar la lógica de negocio ni las funcionalidades existentes.

---

## 1. Filosofía de Diseño: "Warm Tactile Minimalism" (Cocina Artesanal y Real)

La identidad visual no es la de un software corporativo frío ni la de una tienda de delivery genérica. Representa el **obrador digital de Caro**: una cocina cálida, ordenada, táctil y profundamente artesanal.

### Principios Fundamentales
1. **Calidez de Mesa y Cocina:** Los fondos huyen del blanco clínico (#FFFFFF) y del gris plano. La base es el beige cálido (`#F8F7E1` / `#FAF7EA`) con sutiles texturas ilustradas tomadas de `public/backgrounds/`.
2. **Claridad Operativa de un Vistazo:** Los números importantes (costos, stock, precios, alertas) usan tipografía de alto impacto (`Rubik`) para que Caro los lea a distancia o con las manos en la masa.
3. **Anti-patrón de Anidamiento:** Prohibido meter "cards dentro de cards". Los contenedores descansan sobre un único plano (`surface-container-lowest` o `bg-white/95`) delimitados por divisores sutiles en tono canela (`#A6613A` con opacidad suave).
4. **Respeto Absoluto a la Lógica:** Este documento rige **únicamente la capa de presentación (UI/UX)**. Ningún hook, repositorio, cálculo de costos ni contrato de dominio se modifica.

---

## 2. Tokens de Diseño y Mapeo en Tailwind CSS

El proyecto Stitch define la siguiente escala de tokens que se mapea directamente con [tailwind.config.js](file:///home/tomas/lo-de-caro/tailwind.config.js) y las clases utilitarias de Tailwind:

### 2.1 Paleta de Colores

| Token Stitch | Valor HEX | Uso Semántico y Comportamiento |
| :--- | :--- | :--- |
| `mermelada-tomate` (`primary-container`) | `#C13828` | Botones de acción principal (CTA), estados activos de pestañas, llamados a la acción prioritarios. |
| `primary` | `#9f1f13` | Acento rojo oscuro para links activos, titulares y bordes seleccionados. |
| `mermelada-tomate-suave` | `#C35641` | Hover de botones primarios. |
| `madera-canela` (`secondary`) | `#A6613A` | Color estructural: íconos temáticos, subtítulos, bordes cálidos y detalles artesanales. |
| `crema-lima` (`tertiary-fixed`) | `#C0D873` | Indicadores de stock óptimo, ingredientes frescos, confirmaciones y éxito. |
| `tertiary` | `#465800` | Texto de alto contraste sobre pastillas verde lima (`#C0D873`). |
| `hoja-otono` | `#E56B31` | Alertas de stock bajo, reorden prioritario y badges de atención. |
| `beige-base` (`surface`) | `#F8F7E1` | Lienzo base de la aplicación (sustituye al blanco puro de fondo). |
| `beige-calido` (`surface-container-low`) | `#FAF7EA` | Fondo de buscadores, chips inactivos y filas de historial de precios. |
| `charcoal-tinta` (`on-surface`) | `#292524` | Texto principal de titulares, tablas y precios (negro cálido de alto contraste). |
| `on-surface-variant` | `#59413d` | Texto secundario, etiquetas descriptivas y unidades de medida. |
| `surface-container-lowest` | `#ffffff` | Fondo de tarjetas de ingredientes, recetas y filas de ventas. |
| `outline-variant` | `#e1bfb9` | Divisores sutiles y bordes de tarjetas (opacidad recomendada 20%-30%). |

### 2.2 Tipografía

* **Titulares, Métricas y Números Grandes:** `Rubik` (pesos `600` semi-bold y `700` bold). Otorga un carácter suave, geométrico y apetitoso.
* **Cuerpo, Tablas, Formularios y Botones:** `Montserrat` (pesos `400` regular, `500` medium, `600` semi-bold). Garantiza legibilidad impecable en datos numéricos y etiquetas de cocina.

### 2.3 Formas y Geometría (`border-radius`)
* **Botones e Inputs:** `rounded-lg` (`8px`) o `rounded-xl` (`12px`).
* **Tarjetas y Paneles Principales:** `rounded-xl` (`12px`) o `rounded-2xl` (`16px`).
* **Badges y Chips de Estado (STOCK OK / Reponer):** `rounded-full` con padding horizontal generoso (`px-3 py-1`).

---

## 3. Matriz de Vistas Diseñadas en Stitch (Referencia Oficial)

Todas las pantallas fueron generadas y validadas en el proyecto Stitch `projects/12214678904456776125`:

### 3.1 Vistas de Escritorio (Desktop — 2560px / 1280px)

1. **Materias Primas e Insumos**
   * **Screen ID:** `bac160254aa546ab9ed3d8c761a6609f`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1WeYGqufW0VvP1IWS3c3ZdNwL2KqpeX2hmZm-8SZZhuZNsZvFVVPLK7G2FMVaudynIBlsuyy0Fnh40Y3WnMRI4gJUJsUTOD4lrbPFQdsSKtxVbzfAUTIxpGS0zKoPYtV9IzccsO8beFznUtSvlCjnCgM7tu1hgjRxkAjFdlG5pyCpEM9XvlNLs2VuBaG57qzZM57lpICF3AwKpqoS_dtUuS9x7oFVCnQln8Z7FhQ1zMvrrfIejvWQr3JFtO)
   * **Componentes Clave:** 
     - Barra de 4 métricas superiores (*Total Ingredientes*, *Stock Saludable*, *Alertas Reposición*, *Valor Valorizado*).
     - Buscador amplio con fondo `bg-beige-calido`.
     - Fila de ingrediente táctil: ícono temático, nombre + badge `STOCK OK` (Crema de Lima), stock actual y mínimo, costo por unidad destacado y botón desplegable *Ver Historial de Precios*.

2. **Recetas y Costeo**
   * **Screen ID:** `fc51b66d3b6f4e86a198f512aaea4014`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1VQjwViYbN2LDI0Oz2Y5CwOPNv9Hd8TLJzYdZ1p0Sw7hlFKcfUh7CtCNFNvbbuQggbxJq3O1WOh0uYvrMTirAPiUYF0HnFTHjsrir8_GPFL-wFqYbUVoWw3tvOM7UV0xbFsDv2CeeSefk_HAlA7LOo8iPcsglu_uQEyj5_1jr9HyNNDH6dR0BwvAbm4jMEkTZY7GAm_ZVe1nNSvY5-5W_FrWiWGfMRub66NlbJ-MnOpXBmNHIOplfFidLua)
   * **Componentes Clave:** Fichas de recetas con rinde, desglose de costo de materia prima + gasto fijo por porción, margen de ganancia y precio sugerido.

3. **Producción y Freezer**
   * **Screen ID:** `67b6c10819de4eaabd82d5f8654bd57c`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1Xt0ZPLv7IsJl_A2ZMinoWDIwkuEZ2CkgwJRpq5IieN32srLonNLiohbUfAOOuYWLnWu0RThmmXtBgiAMT5puFN27g8NHXN-bwr0DSEhE83gfZqLFoLDOC2UQ_dVt2geN4pzDeqzwyH165ivQooQfspmnDGSeyr4geTNgi9_sEwjIaBiDcCYArC7_cphSBiaVnM5EyGXPGapRO_LcUaH-aXyuCEuf9jlksXdz6nO17E92S5sV_-Xt35mHcX)
   * **Componentes Clave:** Registro de lotes cocinados, descuento automático de stock de insumos y balance de unidades en freezer.

4. **Ventas de Mostrador**
   * **Screen ID:** `acdec45b7493476083bdbf3645c3ffcc`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1V-XKiM6-At1q4pOXebBDClcLoMQieWlomvzUdqTkNgqJmIMEkTVTndHrMDrpBZcOr4_qNf_VMp90RTB0dBs-KhMEP0Ox4Klra6ASgFRZbdLahRgqRcfme4YuebU2lg5UjbNz6xFmgUS67bna25fpbrmkUEkvq4ivkeT_ggC52EJQW8epR0CAzuEEVFw58mnS2MU-F1a6-7xgIszFw2pxcq49gHQu4cuXNmGL48jKwOvxAj3H4BzZ3mjwJ8)
   * **Componentes Clave:** Selector rápido de productos congelados, panel de total, medios de pago (Efectivo, Transferencia, Cuenta Corriente / Fiado) y lista de ventas históricas.

5. **Gastos y Egresos**
   * **Screen ID:** `b0c36b7a133545f49f7af45f56d1fbd4`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1WKkxN-Vwr1ec-ew9gP6icSvGwEGFY_g85jOaLG4h13Vo47r2buCzkABhTXxR76-iUtfoBcbHi4jeYpIM5ElvROuJAyOROkBFjfKHo5UbSIyULmpZojKPkqpMByCIs5C0yxjtEA8tTTdjXQOkdZg6vx21qYg_yiHxbgVhD-nS14OLZMPAoAM5CeSTyP7rppVFUaZlAKIBupLOeouX7WG5v_-XY1q0-hdQfFEjBEgnIIo4NtFrpa_06NLpQ)
   * **Componentes Clave:** Clasificación de gastos fijos y variables, integración con compras de materias primas y discriminación por proveedor.

6. **Finanzas y Balance**
   * **Screen ID:** `f0da3c1673914f6f8e58d891ec4349fa`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1XDTOfRzmRCYlZgdxxaL7UYvTgmef9uCh6wkcS2pvfD4I8XRH_P2ZRuVi_QJd62tXE-KTb44M4cuZeSRrp0_gxPZfULHGox9Ce4LCjR-dEIx8bqshuZw9vMO8r-KzNrRuK7JXb1VWDN065veASpRk8A9rS4Yzn4heLevUoUdPXOhuoa1PzqEJhLSz090U8bUK9rSePd-PZFKYpk78O00MHDIsr8bgoRtqI91Kv9-Qkz3MpQTTeJvKTwXGRi)
   * **Componentes Clave:** Tarjetas de balance mensual (Ventas brutas - Gastos = Ganancia Neta), barra de progreso hacia la meta mensual editable y ranking de productos más vendidos.

---

### 3.2 Vistas Móviles (Mobile — 780px / 390px)

1. **Freezer y Producción Mobile**
   * **Screen ID:** `23df44730589401880597839b82e1e31`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1XPLTT3nHXIc-LK8-iNpXcaKTO6tnJJOaVZIymIhnmMB8YloldXEelKgeiTPK76xv6czoFyJhovm6AKRqwIONI0o4IXnU5W21TvCjDqmOPT7ki846RhE-_C9jyUvuPvvsK0MfmgJqblx8L5p1XD6XRnJfcBqcjKJ0y3UvMRXqXXFm36U1u9Vn5x9IewpSgL490D8NwPyYrEE3hRPR-b3dEY1srBPcLbgqcsrErQe-p_h3JUOycmlP6RKtQb)

2. **Ventas y Mostrador Mobile**
   * **Screen ID:** `b160969070b84b419b6f60e0c54987db`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1VDQonewSmHzf0i5x_C_rQChWS16SOtePCxFioU4vs4P7XggxT54T3mP4WwJRIlOCpkcI4mr72PmmdYICFyWflLXW022EGtvpqlDm26FyXc_BodSXdmrpXZI2EwMegeAN2ty3jEe8Kg7-ANvx0vnMD_-31SvA4CgZKNOrZwMTAh4-pEGqGCi4T5XImJ6PHK87LHcDb_04Y00gcPzBbGKpEZZjbi8QCPtDKD_Eho86ymjxpjq8MlaTiOfkE)

3. **Gastos y Egresos Mobile**
   * **Screen ID:** `1d04d444bdc44c138183b4abcf7640ab`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1VGSjWgl28GlxmL1FGn-C60p2VDkKbDUxEwI65oZZ_FIIhj186T78eYvD6jkNfGtfIkcGhj-hBEOorx1RqTT2SU8A_qmTfpWTv79mcfx5Bv3vdPSRPx7go6mLRnuCjl-296Ow6QwTftNwfJFa_9IT5lQQdYpxlLYHEGIF5utb8YKGlcEd46c0C65Vkah2JhoSBQ86mpxEZi88qRR7fl6ZbMfW3pPwt_cMmGCGh6-mTGDx2JK-rgdf9NlKd6)

4. **Finanzas y Balance Mobile**
   * **Screen ID:** `1f853dba37704bc8b294c4c6ef33cee5`
   * **Captura HD:** [Ver Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1VrXQ5AOdRZX0HrJ4MPUH97-A1EWTvWmqp-U-P9zVXQbOYjugV3EG68pi1iQuAnw2oVdY0hpTR7bq0tiOJGD5uiEbho0HtJqJMuf_7oxGHB9Hllz0TH-JjMLfYUIyUINoMOdY3vFB3TsJWdnMo_dHzXVDEBVtqymR-mBmGe-5AX-KU8PET_H4qjtKtkb-1fchbWGq_ZPp9ahMx67f9CTzZiD8EkTWzFCat2YEG85tRkKao8ye8SE5L8kewT)

---

## 4. Lineamientos de Integración de Fondos y Personajes (`public/`)

### 4.1 Fondos de Marca (`public/backgrounds/`)
El diseño de Stitch contempla el uso armónico de los tres fondos disponibles:
* **Fondo Principal de Trabajo (`back_desktop_1.png` / `back_mobile_1.png`):** Usado en la Pantalla de Login y en los módulos troncales del Obrador (*Materias Primas* y *Recetas*).
* **Fondo de Producción y Mostrador (`back_desktop_2.png` / `back_mobile_2.png`):** Textura cálida orientada a la acción culinaria, aplicada a *Producción* y *Ventas*.
* **Fondo de Balance y Finanzas (`back_desktop_3.png` / `back_mobile_3.png`):** Textura equilibrada para *Gastos* y el tablero de *Finanzas*.
* **Regla Mandatoria de Contraste:** El fondo se renderiza con `bg-cover bg-fixed` con una capa difuminada o traslúcida (`bg-marca-beige/40 backdrop-blur-[1px]`), mientras que las tablas y formularios van siempre sobre tarjetas sólidas/semitraslúcidas (`bg-white/95` o `bg-[#FAF7EA]`) con borde canela sutil (`#A6613A/20`).

### 4.2 Personajes e Ilustraciones (`public/personajes/`)
* **`personaje_principal.png` (Caro):** Anfitrión estelar en el Login y avatar circular en el encabezado del Panel Principal.
* **`Recurso 7.svg` a `Recurso 11.svg`:** Sellos y detalles culinarios distribuidos de forma no invasiva:
  - En estados vacíos (ej. *"No hay lotes producidos hoy"* o *"No hay gastos registrados"*).
  - En cabeceras de diálogo o tips rápidos de cocina.
  - Como marca de agua o sello decorativo discreto en esquinas de tarjetas de resumen.

---

## 5. Arquitectura de Navegación Dual (Desktop vs Mobile)

### En Desktop (`>= 1024px`):
* **Top Header Fijo:** Logo oficial en rojo (`/logos/png rojo.svg`), título *Lo de Caro — Obrador Digital*, barra de pestañas horizontales (`Materias Primas`, `Recetas`, `Producción`, `Ventas`, `Gastos`, `Finanzas`), perfil de Caro y botón de cerrar sesión.

### En Mobile (`< 1024px`):
* **Top Bar Compacta:** Logo + saludo + botón cerrar sesión.
* **Sticky Bottom Navigation Bar:** Barra inferior fija (`fixed bottom-0 z-40`) con los 6 accesos táctiles, garantizando hitboxes de al menos 48px y estado activo resaltado en color tomate (`#C13828`).
