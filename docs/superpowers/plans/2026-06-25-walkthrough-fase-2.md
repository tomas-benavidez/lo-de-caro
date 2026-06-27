# Walkthrough - Fase 2: Supabase y Server Actions

Hemos completado e integrado con éxito toda la **Fase 2** del proyecto. La capa de infraestructura ahora conecta de forma consistente el motor relacional de Supabase con los cimientos matemáticos de nuestro modelo de dominio.

---

## Cambios Realizados

### 1. Base de Datos y Seguridad (Supabase)
- **`supabase/schema.sql`**: 
  - Definición completa del esquema relacional (13 tablas con claves primarias, foráneas y restricciones `CHECK` de integridad).
  - Triggers para sincronización automática de perfiles de usuario (`profiles`) en el registro.
  - Habilitación de **Row Level Security (RLS)** en el 100% de las tablas.
  - Políticas RLS robustas que restringen el acceso total únicamente a usuarios autenticados (bloqueando solicitudes anónimas).
  - **Procedimientos Almacenados Transaccionales (RPC)**:
    - `registrar_lote_produccion_trx`: Ejecuta de forma atómica el alta del lote de producción, sus ingredientes brutos consumidos y descuenta el stock físico de insumos en una transacción única.
    - `registrar_venta_trx`: Inserta de forma atómica la venta y todos sus ítems asociados en una sola transacción.

### 2. Clientes de Supabase en Next.js
- **`src/infrastructure/supabase/server.ts`**: Cliente del servidor que maneja de forma asíncrona las cookies para Server Actions (compatible con Next.js 15 y 16).
- **`src/infrastructure/supabase/client.ts`**: Cliente del navegador para componentes del lado del cliente.

### 3. Server Actions (Adaptadores de Infraestructura)
Desarrollamos los Server Actions modulares bajo `src/infrastructure/actions/` que encapsulan la lógica de persistencia y coordinan con las reglas de negocio puras del Dominio:
- **`insumos.ts`**: ABM de insumos y `registrarCompraInsumo`, el cual calcula el **costo promedio ponderado** dinámicamente con la fórmula del dominio ante nuevas compras.
- **`recetas.ts`**: ABM de recetas e ingredientes con rollback automático si falla la asociación de insumos.
- **`productos.ts`**: ABM de productos con carga anidada para cálculo dinámico del costo de fabricación en cascada.
- **`clientes.ts`**: ABM de clientes para cuentas corrientes.
- **`lotes.ts`**: Registro atómico de producción diaria delegando a la función RPC de Postgres.
- **`ventas.ts`**: Registro atómico de ventas delegando a la función RPC de Postgres.
- **`inversiones.ts`**: Registro de bienes de capital y cálculo automático de amortización mensual.
- **`costos_fijos.ts`** y **`configuracion.ts`**: Gestión de gastos fijos mensuales y configuración de metas de producción global.

---

## Pruebas y Validación

### Pruebas de Integración y Reglas de Negocio
Creamos una suite de pruebas rigurosa en `src/infrastructure/__tests__/actions.test.ts` utilizando mocks aislados de Supabase para validar la orquestación:
- **Costo Promedio Ponderado**: Verificación de que la compra de insumos recalcula correctamente el promedio ponderado de costos según el stock remanente en la alacena.
- **Transaccionalidad en RPC**: Confirmación de que las acciones de Lotes y Ventas delegan correctamente sus parámetros estructurados a los procedimientos almacenados de Postgres.

### Resultados de Ejecución
Todos los tests (20 unitarios de dominio + 5 de integración de infraestructura) pasaron con éxito:

```bash
> vitest run

 RUN  v4.1.9 /home/tomas/la-casa-cocina

 ✓ src/domain/__tests__/insumo.test.ts (1 test)
 ✓ src/domain/__tests__/producto.test.ts (4 tests)
 ✓ src/domain/__tests__/caja.test.ts (2 tests)
 ✓ src/domain/__tests__/receta.test.ts (3 tests)
 ✓ src/domain/__tests__/lote.test.ts (2 tests)
 ✓ src/domain/__tests__/calculadora_compras.test.ts (3 tests)
 ✓ src/infrastructure/__tests__/actions.test.ts (5 tests)
 ✓ src/domain/__tests__/utils.test.ts (2 tests)
 ✓ src/domain/__tests__/costos.test.ts (3 tests)

 Test Files  9 passed (9)
      Tests  25 passed (25)
   Start at  11:22:47
   Duration  648ms

---

## Pasos manuales requeridos (Acción del Usuario)

Para poder avanzar a la Fase 3, debés realizar las siguientes configuraciones en tu panel de Supabase:

1. **Crear las tablas y funciones (DDL)**:
   - Copiá todo el contenido del archivo local [schema.sql](file:///home/tomas/la-casa-cocina/supabase/schema.sql).
   - Ve a tu proyecto de Supabase, entrá en la sección **SQL Editor**, creá una nueva consulta, pegá el contenido y ejecutalo (clic en *Run*). Esto creará todas las tablas, relaciones, triggers, políticas de seguridad RLS y funciones transaccionales (RPC).

2. **Configurar la Autenticación**:
   - En el panel de Supabase, ve a **Authentication** -> **Providers** y asegurate de que el proveedor **Email** esté habilitado (con la opción *Confirm email* desactivada si querés agilizar el desarrollo local y las pruebas).

3. **Crear tu primer usuario**:
   - En **Authentication** -> **Users**, hacé clic en **Add user** -> **Create user**. Ingresá un correo y contraseña. Al crearlo, el trigger de la base de datos creará automáticamente tu registro correspondiente en la tabla `profiles`.
```
