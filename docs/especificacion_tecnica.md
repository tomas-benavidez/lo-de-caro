# Especificación Técnica y Arquitectura - MVP "Lo de Caro"

Este documento establece la arquitectura técnica, el stack tecnológico, el modelo de datos en PostgreSQL y el esquema de despliegue para el MVP de **"Lo de Caro"**.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Justificación y Rol |
| :--- | :--- | :--- |
| **Build Tool / Bundler** | **Vite** | Dev server ultra rápido con ESM nativo. Genera un bundle estático optimizado (`dist/`). |
| **Frontend UI** | **React 18/19 + TypeScript** | Interfaz declarativa, tipado estricto de entidades de dominio y componentes modulares. |
| **Estilos** | **Tailwind CSS** | Utility-first CSS, mobile-first responsivo y paleta de marca personalizada. |
| **PWA Engine** | **vite-plugin-pwa** | Permite instalar la web como app nativa en el celular (Service Workers + Web App Manifest). |
| **Hosting & Edge API** | **Cloudflare Pages + Functions** | CDN global sin servidores, costo $0 de por vida, 0ms de arranque en frío. La carpeta `/functions` expone la API backend. |
| **Base de Datos & Auth** | **Supabase (PostgreSQL)** | Base de datos relacional con integridad transaccional (ACID), migraciones SQL y autenticación. |
| **Testing de Dominio** | **Vitest** | Pruebas unitarias ultrarrápidas de la lógica de negocio y cálculos financieros. |

---

## 2. Mapa Arquitectónico (Separación de Capas)

```
[ Celular de Caro (PWA) ]
        │
        │ HTTP / JSON
        ▼
[ Cloudflare Pages (Frontend Estático) ]
        │
        │ Llamadas a /api/...
        ▼
[ Cloudflare Pages Functions (/functions) ]  ───► Capa de Controladores / Backend
        │
        │ Conexión PostgreSQL / PostgREST (Service Role / JWT)
        ▼
[ Supabase (PostgreSQL) ]                   ───► Capa de Persistencia y Transacciones
```

---

## 3. Modelo de Base de Datos (Esquema SQL de Postgres)

### A. Tabla `materias_primas`
```sql
CREATE TABLE materias_primas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(10) NOT NULL CHECK (unidad_medida IN ('g', 'ml', 'u')),
    costo_unitario NUMERIC(12, 4) NOT NULL DEFAULT 0, -- Costo por g, ml o unidad
    stock_actual NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B. Tabla `productos`
```sql
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- Pastas Rellenas, Lisas, Empanadas, Tartas, Salsas
    unidad_venta VARCHAR(20) NOT NULL, -- Porcion, Docena, Kilo, Unidad
    precio_lista NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock_actual NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Unidades terminadas en freezer
    stock_minimo NUMERIC(12, 2) NOT NULL DEFAULT 5,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### C. Tabla `receta_ingredientes` (Relación Producto ↔ Materia Prima)
```sql
CREATE TABLE receta_ingredientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    materia_prima_id UUID NOT NULL REFERENCES materias_primas(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12, 2) NOT NULL, -- Cantidad requerida para 1 unidad de venta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (producto_id, materia_prima_id)
);
```

### D. Tabla `lotes_produccion`
```sql
CREATE TABLE lotes_produccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad_elaborada NUMERIC(12, 2) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### E. Tabla `clientes`
```sql
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_apellido VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### F. Tablas `ventas` y `venta_items`
```sql
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estado_pago VARCHAR(20) NOT NULL CHECK (estado_pago IN ('Pagado', 'Pendiente', 'Regalo')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE venta_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12, 2) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);
```

### G. Tabla `gastos`
```sql
CREATE TABLE gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    concepto VARCHAR(200) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Materia Prima', 'Packaging', 'Servicios', 'Equipamiento', 'Otros')),
    monto NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Transaccionalidad Crítica (Funciones PostgreSQL)

Para evitar inconsistencias de inventario, el registro de producción y ventas se ejecuta mediante transacciones atómicas de base de datos (`Postgres Functions / RPC`):

1. **`registrar_produccion(p_producto_id, p_cantidad, p_observaciones)`**:
   * Descuenta stock de cada ingrediente en `materias_primas`: `stock_actual - (cantidad * receta_ingredientes.cantidad)`.
   * Incrementa stock en `productos`: `stock_actual + p_cantidad`.
   * Inserta registro en `lotes_produccion`.
   * Si cualquier ingrediente genera stock negativo no permitido o falla, se revierte todo (`ROLLBACK`).

2. **`registrar_venta(p_cliente_id, p_items, p_estado_pago)`**:
   * Descuenta stock de cada producto en `productos`: `stock_actual - item.cantidad`.
   * Inserta registro en `ventas` y `venta_items`.
   * Si `estado_pago == 'Pendiente'`, actualiza `clientes.saldo_pendiente += total`.

---

## 5. Estructura de Carpetas (Clean / Hexagonal Architecture)

El código fuente del frontend y de la lógica de negocio se organiza siguiendo la separación de capas de la Arquitectura Limpia, manteniendo el núcleo de negocio completamente desacoplado del framework:

```
lo-de-caro/
├── docs/                             # Especificaciones y base de conocimiento viva
│   ├── contexto/                     # Errores conocidos, convenciones y decisiones
│   ├── especificacion_MVP.md         # Alcance funcional cerrado
│   ├── especificacion_tecnica.md     # Blueprint técnico y esquema SQL
│   └── manual_marca.md               # Tokens de diseño y colores
├── functions/                        # Backend Serverless en Cloudflare Pages
│   └── api/                          # Endpoints REST (/api/produccion, /api/ventas, etc.)
├── public/                           # Assets estáticos, íconos y manifest PWA
├── src/
│   ├── domain/                       # NÚCLEO PURO: Sin dependencias de React ni Supabase
│   │   ├── models/                   # Interfaces y tipos (MateriaPrima, Producto, Receta, Venta)
│   │   ├── services/                 # Reglas de negocio puras (calculadorCostos, validadorStock)
│   │   └── repositories/             # Interfaces de repositorios (puertos de salida)
│   ├── application/                  # CASOS DE USO: Orquestan el flujo de datos
│   │   ├── useCases/                 # registrarLoteProduccion, registrarVenta, calcularMetaMensual
│   │   └── dtos/                     # Tipos de entrada y salida para la UI
│   ├── infrastructure/               # ADAPTADORES EXTERNOS: Supabase, LocalStorage, Fetch
│   │   ├── supabase/                 # Cliente de Supabase, queries y llamadas RPC
│   │   └── repositories/             # Implementaciones concretas de los puertos del dominio
│   ├── presentation/                 # UI REACT (Componentes y Páginas)
│   │   ├── components/               # Componentes atómicos (Botones, Inputs, Cards con 5 estados)
│   │   ├── hooks/                    # Custom hooks para desacoplar lógica de render
│   │   ├── pages/                    # Vistas principales (MateriasPrimas, Recetas, Produccion, Ventas, Balance)
│   │   └── styles/                   # Configuración y extensiones de Tailwind
│   ├── App.tsx                       # Enrutador y layout principal
│   └── main.tsx                      # Punto de entrada de Vite
├── tests/                            # Pruebas unitarias de dominio con Vitest
│   ├── domain/                       # Tests de fórmulas de costos, recetas y stock
│   └── application/                  # Tests de los casos de uso en aislamiento
├── index.html                        # HTML base mobile-first
├── tailwind.config.js                # Paleta Lo de Caro y tokens de marca
├── vite.config.ts                    # Configuración de Vite + PWA plugin
└── package.json                      # Scripts y dependencias oficiales
```

---

## 6. Convenciones de Clean Code y Nombres en Español

1. **Lenguaje Ubicuo (Español Estricto):**
   * Todo identificador del dominio debe escribirse en **Español** para reflejar la realidad del negocio gastronómico.
   * Modelos: `MateriaPrima`, `Producto`, `RecetaIngrediente`, `LoteProduccion`, `Venta`, `Cliente`, `Gasto`.
   * Variables y funciones: `costoUnitario`, `stockActual`, `precioLista`, `registrarProduccion()`, `calcularMargenPorcion()`.
   * Parámetros y DTOs: `datosNuevaVenta`, `itemsSeleccionados`, `metaMensualRetiro`.

2. **Clean Code & Tipado Estricto:**
   * Prohibido el uso de `any` en TypeScript.
   * Funciones cortas con **Responsabilidad Única (SRP)**: no mezclar cálculos matemáticos de recetas con lógica de renderizado en React.
   * Código autodocumentado: nombres claros y autoexplicativos que no requieran comentarios obvios.

3. **5 Estados en Todo Control Interactivo:**
   * Botones, inputs y tarjetas clicables deben implementar visual y funcionalmente: `Default`, `Hover`, `Active`, `Focus` (`:focus-visible` de alto contraste) y `Disabled`.

---

## 7. Trazabilidad y Documentación Continua

* **Reporte de Cierre por Tarea:** Al finalizar cualquier tarea atómica, `@implementer` debe documentar el **CÓMO, POR QUÉ y PARA QUÉ** de la implementación.
* **Bitácora Antirregresiones:** Todo error técnico no trivial se registra en `docs/contexto/errores-conocidos.md` indicando síntoma, causa raíz y regla preventiva.
* **Memoria Persistente con Engram:** Al cierre de cada hito verificado, se guarda el estado en Engram (`mem_save`) bajo el tópico `lo-de-caro` para asegurar continuidad entre sesiones.

---

## 8. Módulo de Autenticación y Seguridad (SPEC-006)

### 8.1 Modelo de Seguridad y Gating de Rutas
Para proteger las fórmulas de costeo, márgenes y balance comercial privado:
- **Autenticación con Supabase Auth:** Gestión de sesión segura basada en JWT y `refresh_token` almacenados en almacenamiento seguro del navegador.
- **Sin Registro Público:** Prohibido el autoservicio de sign-up en frontend. La cuenta de administración se provisiona de forma estricta y directa en Supabase Auth (`auth.users`).
- **Gating a Nivel Raíz (`App.tsx`):**
  - Mientras se verifica el token persistido (`cargandoSesion`), se renderiza un splash con la identidad visual.
  - Si no hay sesión válida, se renderiza exclusivamente `PantallaLogin`.
  - El componente `PanelPrincipal` (y por ende los hooks `useMateriasPrimas`, `useProductosRecetas`, `useProduccion`, `useVentasCobranzas`, `useGastos`) **no se monta en el árbol de componentes**, imposibilitando cualquier fuga de datos por inspección de red previa a la autenticación.
- **Cierre de Sesión:** Botón accesible en la cabecera superior que revoca la sesión activa (`signOut()`) y retorna inmediatamente al login.

