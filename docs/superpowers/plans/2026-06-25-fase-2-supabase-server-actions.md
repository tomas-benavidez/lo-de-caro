# Fase 2: Supabase y Server Actions - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Diseñar el esquema de base de datos relacional y las políticas de seguridad RLS en Supabase, y desarrollar la capa de Infraestructura mediante Server Actions de Next.js integrando los cimientos matemáticos del dominio.

**Architecture:** Arquitectura limpia desacoplada. Los Server Actions en la capa de Infraestructura sirven como adaptadores que conectan la base de datos (Supabase Client) con las reglas y validaciones puras del Dominio, garantizando transacciones atómicas mediante procedimientos almacenados en PostgreSQL (RPC) para operaciones complejas como registro de producción y ventas.

**Tech Stack:** Next.js (Server Actions, App Router), Supabase (Postgres, RLS, RPC), TypeScript, Vitest.

---

## User Review Required

> [!IMPORTANT]
> Se han añadido dos tablas adicionales no explícitas en el DDL original para soportar el 100% de las reglas de negocio:
> 1. **`costos_fijos`**: Para guardar conceptos (Luz, Alquiler, etc.) y montos de costos de estructura.
> 2. **`configuracion`**: Para almacenar variables globales como `estimacion_mensual_produccion` necesaria para el prorrateo.
>
> Además, para garantizar atomicidad física (evitar estados inconsistentes en stock si una petición falla a la mitad), se proponen dos procedimientos almacenados de base de datos (RPC) en Postgres:
> - `registrar_lote_produccion`: Inserta lote, ítems y descuenta stock de insumos en una sola transacción.
> - `registrar_venta`: Inserta venta y sus ítems en una sola transacción.

---

## Proposed Changes

### 1. Database & Security (Supabase)
Esquema DDL completo con integridad referencial, triggers de perfil automático, políticas de seguridad RLS y funciones transaccionales (RPC).

#### [NEW] [schema.sql](file:///home/tomas/la-casa-cocina/supabase/schema.sql)

### 2. Infrastructure Layer (Supabase Clients)
Configuración de clientes de Supabase para Next.js con soporte de Server Actions y cookies.

#### [NEW] [server.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/supabase/server.ts)
#### [NEW] [client.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/supabase/client.ts)

### 3. Server Actions (Infrastructure Adapters)
Funciones de servidor modulares para interactuar con la base de datos y aplicar reglas matemáticas del dominio.

#### [NEW] [insumos.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/insumos.ts)
#### [NEW] [recetas.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/recetas.ts)
#### [NEW] [productos.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/productos.ts)
#### [NEW] [clientes.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/clientes.ts)
#### [NEW] [lotes.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/lotes.ts)
#### [NEW] [ventas.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/ventas.ts)
#### [NEW] [inversiones.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/inversiones.ts)
#### [NEW] [costos_fijos.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/costos_fijos.ts)
#### [NEW] [configuracion.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/actions/configuracion.ts)

### 4. Verification & Testing
Pruebas de integración simulando (mocking) el cliente de Supabase para asegurar que las acciones coordinan correctamente el flujo con el Dominio.

#### [NEW] [actions.test.ts](file:///home/tomas/la-casa-cocina/src/infrastructure/__tests__/actions.test.ts)

---

## Detailed Tasks

### Task 1: Supabase Database Schema, RLS, and Stored Procedures
**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Crear el archivo de esquema completo con políticas RLS y funciones transaccionales**
  Escribir el script SQL con soporte para creación de perfil por trigger y las funciones de negocio atómicas.

```sql
-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Perfiles de Usuario
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabla de Insumos (Materia Prima / Envases)
CREATE TABLE insumos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    unidad_medida VARCHAR(10) NOT NULL CHECK (unidad_medida IN ('g', 'ml', 'u')),
    costo_bruto_unitario DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
    stock_actual DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    stock_minimo DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabla de Recetas
CREATE TABLE recetas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    porciones_rendimiento INTEGER NOT NULL DEFAULT 1 CHECK (porciones_rendimiento > 0),
    costo_envase DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabla de Relación Receta - Ingredientes
CREATE TABLE receta_ingredientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE NOT NULL,
    insumo_id UUID REFERENCES insumos(id) ON DELETE RESTRICT NOT NULL,
    peso_limpio DECIMAL(10, 2) NOT NULL CHECK (peso_limpio > 0),
    porcentaje_merma DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (porcentaje_merma >= 0 AND porcentaje_merma < 100),
    UNIQUE(receta_id, insumo_id)
);

-- 5. Tabla de Productos de Venta
CREATE TABLE productos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    receta_id UUID REFERENCES recetas(id) ON DELETE RESTRICT NOT NULL,
    unidad_venta VARCHAR(50) NOT NULL,
    cantidad_unidades_base INTEGER NOT NULL CHECK (cantidad_unidades_base > 0),
    precio_lista DECIMAL(10, 2) NOT NULL CHECK (precio_lista >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabla de Clientes
CREATE TABLE clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre_apellido VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabla de Lotes de Producción
CREATE TABLE lotes_produccion (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    receta_id UUID REFERENCES recetas(id) ON DELETE RESTRICT NOT NULL,
    cantidad_producida INTEGER NOT NULL CHECK (cantidad_producida > 0),
    registrado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Tabla de Ingredientes Consumidos por Lote
CREATE TABLE lote_ingredientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lote_id UUID REFERENCES lotes_produccion(id) ON DELETE CASCADE NOT NULL,
    insumo_id UUID REFERENCES insumos(id) ON DELETE RESTRICT NOT NULL,
    cantidad_bruta_consumida DECIMAL(12, 2) NOT NULL CHECK (cantidad_bruta_consumida >= 0),
    UNIQUE(lote_id, insumo_id)
);

-- 9. Tabla de Ventas
CREATE TABLE ventas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT NOT NULL,
    estado_cobro VARCHAR(20) NOT NULL CHECK (estado_cobro IN ('Cobrada', 'Pendiente')),
    registrado_por UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 10. Tabla de Ítems de la Venta
CREATE TABLE venta_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE NOT NULL,
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_cobrado_real DECIMAL(10, 2) NOT NULL CHECK (precio_cobrado_real >= 0)
);

-- 11. Tabla de Inversiones (Maquinarias, etc.)
CREATE TABLE inversiones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
    vida_util_anios INTEGER NOT NULL CHECK (vida_util_anios > 0),
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    registrado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Tabla de Costos Fijos
CREATE TABLE costos_fijos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    concepto VARCHAR(150) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL CHECK (monto >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Tabla de Configuración Global
CREATE TABLE configuracion (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE lote_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inversiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE costos_fijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- CREAR POLÍTICAS DE SEGURIDAD PARA USUARIOS AUTENTICADOS (MÁXIMO CONTROL)
CREATE POLICY "Permitir todo a autenticados" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON insumos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON recetas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON receta_ingredientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON lotes_produccion FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON lote_ingredientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON venta_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON inversiones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON costos_fijos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a autenticados" ON configuracion FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIGGER PARA AUTO-CREACIÓN DE PROFILE AL REGISTRARSE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROCEDIMIENTOS ALMACENADOS (RPC) TRANSACCIONALES
-- 1. Registrar Lote de Producción y descontar insumos atómicamente
CREATE OR REPLACE FUNCTION registrar_lote_produccion_trx(
  p_fecha DATE,
  p_receta_id UUID,
  p_cantidad_producida INTEGER,
  p_registrado_por UUID,
  p_ingredientes JSONB
) RETURNS UUID AS $$
DECLARE
  v_lote_id UUID;
  v_ingrediente RECORD;
BEGIN
  INSERT INTO lotes_produccion (fecha, receta_id, cantidad_producida, registrado_por)
  VALUES (p_fecha, p_receta_id, p_cantidad_producida, p_registrado_por)
  RETURNING id INTO v_lote_id;

  FOR v_ingrediente IN 
    SELECT (value->>'insumo_id')::UUID AS insumo_id, 
           (value->>'cantidad_bruta_consumida')::DECIMAL AS cantidad_bruta_consumida
    FROM jsonb_array_elements(p_ingredientes)
  LOOP
    INSERT INTO lote_ingredientes (lote_id, insumo_id, cantidad_bruta_consumida)
    VALUES (v_lote_id, v_ingrediente.insumo_id, v_ingrediente.cantidad_bruta_consumida);

    UPDATE insumos
    SET stock_actual = stock_actual - v_ingrediente.cantidad_bruta_consumida
    WHERE id = v_ingrediente.insumo_id;
  END LOOP;

  RETURN v_lote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Registrar Venta y sus ítems atómicamente
CREATE OR REPLACE FUNCTION registrar_venta_trx(
  p_cliente_id UUID,
  p_estado_cobro VARCHAR,
  p_registrado_por UUID,
  p_items JSONB
) RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  v_item RECORD;
BEGIN
  INSERT INTO ventas (cliente_id, estado_cobro, registrado_por)
  VALUES (p_cliente_id, p_estado_cobro, p_registrado_por)
  RETURNING id INTO v_venta_id;

  FOR v_item IN 
    SELECT (value->>'producto_id')::UUID AS producto_id, 
           (value->>'cantidad')::INTEGER AS cantidad, 
           (value->>'precio_cobrado_real')::DECIMAL AS precio_cobrado_real
    FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_cobrado_real)
    VALUES (v_venta_id, v_item.producto_id, v_item.cantidad, v_item.precio_cobrado_real);
  END LOOP;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Task 2: Install Supabase Client Libraries & Setup Configuration
**Files:**
- Modify: `package.json`
- Create: `src/infrastructure/supabase/server.ts`
- Create: `src/infrastructure/supabase/client.ts`

- [ ] **Step 1: Añadir las dependencias en `package.json`**
  Añadir `@supabase/supabase-js` y `@supabase/ssr` en dependencies.
- [ ] **Step 2: Instalar paquetes**
  Ejecutar: `npm install`
- [ ] **Step 3: Crear el cliente de Supabase para el Servidor (`src/infrastructure/supabase/server.ts`)**
  Escribir el código que inicializa el cliente utilizando las cookies de Next.js.

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorado si se llama desde Server Components
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Crear el cliente de Supabase para el Cliente (`src/infrastructure/supabase/client.ts`)**

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

---

### Task 3: Insumos Server Actions & Average Cost logic
**Files:**
- Create: `src/infrastructure/actions/insumos.ts`

- [ ] **Step 1: Crear e implementar Server Actions de Insumos**
  Implementar creación, listado, actualización, borrado y la acción de **registrar compra** actualizando el costo promedio ponderado.

```typescript
'use server';
import { createClient } from '../supabase/server';
import { Insumo, calcularCostoBrutoUnitario } from '@/domain/insumo';

export async function getInsumos(): Promise<Insumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al obtener insumos: ${error.message}`);
  return data.map(item => ({
    ...item,
    created_at: new Date(item.created_at),
    costo_bruto_unitario: Number(item.costo_bruto_unitario),
    stock_actual: Number(item.stock_actual),
    stock_minimo: item.stock_minimo ? Number(item.stock_minimo) : undefined,
  }));
}

export async function createInsumo(data: Omit<Insumo, 'id' | 'created_at' | 'costo_bruto_unitario'>) {
  const supabase = await createClient();
  const { data: insumo, error } = await supabase
    .from('insumos')
    .insert([{
      nombre: data.nombre,
      unidad_medida: data.unidad_medida,
      stock_actual: data.stock_actual,
      stock_minimo: data.stock_minimo,
      costo_bruto_unitario: 0.0000
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear insumo: ${error.message}`);
  return insumo;
}

export async function registrarCompraInsumo(insumoId: string, precioPagado: number, cantidadComprada: number) {
  const supabase = await createClient();

  // 1. Obtener el insumo actual
  const { data: insumo, error: fetchError } = await supabase
    .from('insumos')
    .select('*')
    .eq('id', insumoId)
    .single();

  if (fetchError || !insumo) {
    throw new Error(`Insumo no encontrado: ${fetchError?.message}`);
  }

  // 2. Calcular costo unitario de esta compra usando el dominio
  const costoCompraUnitario = calcularCostoBrutoUnitario(precioPagado, cantidadComprada);

  // 3. Calcular nuevo costo promedio ponderado
  const stockActual = Number(insumo.stock_actual);
  const costoActual = Number(insumo.costo_bruto_unitario);
  let nuevoCosto = costoCompraUnitario;

  if (stockActual > 0) {
    const totalCostoActual = stockActual * costoActual;
    const nuevoStockTotal = stockActual + cantidadComprada;
    nuevoCosto = (totalCostoActual + precioPagado) / nuevoStockTotal;
    // Redondear a 4 decimales
    nuevoCosto = Number(Math.round(Number(nuevoCosto + 'e4')) + 'e-4');
  }

  const nuevoStock = stockActual + cantidadComprada;

  // 4. Actualizar en base de datos
  const { data: updated, error: updateError } = await supabase
    .from('insumos')
    .update({
      stock_actual: nuevoStock,
      costo_bruto_unitario: nuevoCosto
    })
    .eq('id', insumoId)
    .select()
    .single();

  if (updateError) throw new Error(`Error al actualizar stock y costo: ${updateError.message}`);
  return updated;
}
```

---

### Task 4: Recetas y Ingredientes Server Actions
**Files:**
- Create: `src/infrastructure/actions/recetas.ts`

- [ ] **Step 1: Crear e implementar Server Actions de Recetas**
  Implementar transacciones seguras para crear recetas y asociar sus ingredientes simultáneamente.

```typescript
'use server';
import { createClient } from '../supabase/server';
import { Receta, IngredienteReceta } from '@/domain/receta';

export async function getRecetas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recetas')
    .select(`
      *,
      receta_ingredientes (
        *
      )
    `)
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al obtener recetas: ${error.message}`);
  return data;
}

export async function createReceta(
  nombre: string,
  porcionesRendimiento: number,
  costoEnvase: number,
  ingredientes: Omit<IngredienteReceta, 'id' | 'receta_id'>[]
) {
  const supabase = await createClient();

  // 1. Insertar la receta
  const { data: receta, error: recetaError } = await supabase
    .from('recetas')
    .insert([{
      nombre,
      porciones_rendimiento: porcionesRendimiento,
      costo_envase: costoEnvase
    }])
    .select()
    .single();

  if (recetaError || !receta) {
    throw new Error(`Error al crear la receta: ${recetaError?.message}`);
  }

  // 2. Insertar los ingredientes asociados si existen
  if (ingredientes.length > 0) {
    const ingredientesData = ingredientes.map(ing => ({
      receta_id: receta.id,
      insumo_id: ing.insumo_id,
      peso_limpio: ing.peso_limpio,
      porcentaje_merma: ing.porcentaje_merma
    }));

    const { error: ingError } = await supabase
      .from('receta_ingredientes')
      .insert(ingredientesData);

    if (ingError) {
      // Intentar limpiar receta huérfana en caso de error
      await supabase.from('recetas').delete().eq('id', receta.id);
      throw new Error(`Error al insertar ingredientes de receta: ${ingError.message}`);
    }
  }

  return receta;
}
```

---

### Task 5: Productos de Venta Server Actions
**Files:**
- Create: `src/infrastructure/actions/productos.ts`

- [ ] **Step 1: Crear e implementar Server Actions de Productos**
  Crear acciones para listar, crear, actualizar y borrar productos terminados, integrando los cálculos dinámicos de costos de fabricación.

```typescript
'use server';
import { createClient } from '../supabase/server';
import { ProductoVenta } from '@/domain/producto';

export async function getProductos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      recetas (
        *,
        receta_ingredientes (
          *,
          insumos (*)
        )
      )
    `)
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al obtener productos: ${error.message}`);
  return data;
}

export async function createProducto(data: Omit<ProductoVenta, 'id' | 'created_at'>) {
  const supabase = await createClient();
  const { data: producto, error } = await supabase
    .from('productos')
    .insert([{
      nombre: data.nombre,
      receta_id: data.receta_id,
      unidad_venta: data.unidad_venta,
      cantidad_unidades_base: data.cantidad_unidades_base,
      precio_lista: data.precio_lista
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear producto: ${error.message}`);
  return producto;
}
```

---

### Task 6: Clientes, Costos Fijos e Inversiones Server Actions
**Files:**
- Create: `src/infrastructure/actions/clientes.ts`
- Create: `src/infrastructure/actions/inversiones.ts`
- Create: `src/infrastructure/actions/costos_fijos.ts`
- Create: `src/infrastructure/actions/configuracion.ts`

- [ ] **Step 1: Crear acciones para Clientes**
  Manejo del registro de clientes para seguimiento de cuentas.
- [ ] **Step 2: Crear acciones para Inversiones**
  Soporte de registro de maquinaria con cálculo de amortizaciones.
- [ ] **Step 3: Crear acciones para Costos Fijos y Configuración**
  Administrar los costos estructurales mensuales y la estimación de producción.

```typescript
// src/infrastructure/actions/costos_fijos.ts
'use server';
import { createClient } from '../supabase/server';

export async function getCostosFijos() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('costos_fijos').select('*');
  if (error) throw new Error(error.message);
  return data;
}

export async function createCostoFijo(concepto: string, monto: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('costos_fijos')
    .insert([{ concepto, monto }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
```

---

### Task 7: Lotes de Producción y Ventas Server Actions (Transaccionales con RPC)
**Files:**
- Create: `src/infrastructure/actions/lotes.ts`
- Create: `src/infrastructure/actions/ventas.ts`

- [ ] **Step 1: Crear Server Action de Lotes utilizando la RPC transaccional**
  Implementar el registro atómico y seguro de cocina.

```typescript
'use server';
import { createClient } from '../supabase/server';

export async function registrarLoteProduccion(
  fecha: string,
  recetaId: string,
  cantidadProducida: number,
  registradoPor: string,
  ingredientes: { insumo_id: string; cantidad_bruta_consumida: number }[]
) {
  const supabase = await createClient();

  // Llamar al procedimiento almacenado de Postgres (RPC)
  const { data: loteId, error } = await supabase.rpc('registrar_lote_produccion_trx', {
    p_fecha: fecha,
    p_receta_id: recetaId,
    p_cantidad_producida: cantidadProducida,
    p_registrado_por: registradoPor,
    p_ingredientes: ingredientes
  });

  if (error) {
    throw new Error(`Error transaccional al registrar lote de producción: ${error.message}`);
  }

  return loteId;
}
```

- [ ] **Step 2: Crear Server Action de Ventas utilizando la RPC transaccional**
  Implementar el mostrador de ventas atómico.

```typescript
'use server';
import { createClient } from '../supabase/server';

export async function registrarVenta(
  clienteId: string,
  estadoCobro: 'Cobrada' | 'Pendiente',
  registradoPor: string,
  items: { producto_id: string; cantidad: number; precio_cobrado_real: number }[]
) {
  const supabase = await createClient();

  const { data: ventaId, error } = await supabase.rpc('registrar_venta_trx', {
    p_cliente_id: clienteId,
    p_estado_cobro: estadoCobro,
    p_registrado_por: registradoPor,
    p_items: items
  });

  if (error) {
    throw new Error(`Error transaccional al registrar venta: ${error.message}`);
  }

  return ventaId;
}
```

---

### Task 8: Unit & Integration Tests for Server Actions
**Files:**
- Create: `src/infrastructure/__tests__/actions.test.ts`

- [ ] **Step 1: Escribir pruebas de integración con Mocking de Supabase**
  Comprobar que el adaptador de Server Actions ejecuta correctamente las fórmulas de negocio del Dominio (por ejemplo, el cálculo del costo promedio ponderado de insumos al registrar compra, y el ruteo hacia las RPC).

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrarCompraInsumo } from '../actions/insumos';

// Mock de la conexión de cookies de Next.js y supabase server
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}));

const mockSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
const mockSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) });

vi.mock('../supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    }),
  }),
}));

describe('Insumos Server Actions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería calcular y actualizar el costo promedio ponderado correctamente al registrar compra', async () => {
    // Estado inicial de la base de datos simulado
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'insumo-123',
        nombre: 'Harina',
        stock_actual: 10,
        costo_bruto_unitario: 1.5, // 10 unidades a 1.5 = 15 total
      },
      error: null,
    });

    // Respuesta del update simulada
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'insumo-123',
        nombre: 'Harina',
        stock_actual: 30,
        costo_bruto_unitario: 1.8333, // (15 + 40) / 30 = 1.8333
      },
      error: null,
    });

    const result = await registrarCompraInsumo('insumo-123', 40, 20); // Compra de 20u por 40 pesos (unitario = 2)

    expect(result.stock_actual).toBe(30);
    expect(result.costo_bruto_unitario).toBe(1.8333);
  });
});
```

- [ ] **Step 2: Ejecutar los tests de integración**
  Ejecutar: `npm run test:run`
  Expected: PASS para todas las pruebas incluyendo la nueva suite de acciones.

---

## Verification Plan

### Automated Tests
- Correr `npm run test:run` para asegurar la integridad matemática del dominio y el correcto comportamiento de la integración en los Server Actions con mock de Supabase.

### Manual Verification
- Cargar `supabase/schema.sql` directamente en el editor SQL de Supabase para validar la compilación nativa de Postgres, la creación automática de perfiles, las restricciones de integridad relacional, las políticas RLS y los triggers/funciones transaccionales.
