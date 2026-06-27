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
