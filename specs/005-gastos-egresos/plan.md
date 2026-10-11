# Plan Técnico de Arquitectura: Módulo de Gastos y Egresos Operativos

- **Identificador:** `PLAN-005`
- **Módulo:** Gastos y Egresos Operativos (SPEC-005)
- **Enfoque:** Clean Architecture + Ponytail (YAGNI, Simplicidad, Cero Bloat, Transaccionalidad Segura)

---

## 1. Diseño Arquitectónico por Capas

```
[ UI React Mobile-First: ListaGastos / ModalNuevoGasto / ModalConfirmacion ]
                                   │
                                   ▼
                       [ Hook: useGastos ] ──► (Application Layer)
                                   │
                                   ▼
              [ Repositorio: gastoRepositorio ] ──► (Infrastructure Layer)
                                   │
                                   ▼
             [ Supabase PostgreSQL: gastos, materias_primas ]
```

---

## 2. Capa de Dominio (`src/domain/`)

### A. Modelos (`src/domain/models/gasto.ts`)
- `CategoriaGasto`: `'Materia Prima' | 'Packaging' | 'Servicios' | 'Equipamiento' | 'Otros'`.
- `CategoriaGastoFiltro`: `'Todas' | CategoriaGasto`.
- `MetodoPagoGasto`: `'Efectivo' | 'Transferencia'`.
- `DetalleCompraMateriaPrima`:
  ```ts
  export interface DetalleCompraMateriaPrima {
    materiaPrimaId: string;
    nombreMateriaPrima: string;
    cantidadComprada: number;
    unidadMedida: UnidadMedida;
    actualizarCostoUnitario: boolean;
    nuevoCostoUnitario?: number;
  }
  ```
- `Gasto`:
  ```ts
  export interface Gasto {
    id: string;
    fecha: string; // YYYY-MM-DD
    concepto: string;
    categoria: CategoriaGasto;
    monto: number;
    metodoPago: MetodoPagoGasto;
    compraMateriaPrima?: DetalleCompraMateriaPrima;
    fechaCreacion?: string;
  }
  ```
- `NuevoGastoInput`:
  ```ts
  export interface NuevoGastoInput {
    fecha?: string;
    concepto: string;
    categoria: CategoriaGasto;
    monto: number;
    metodoPago: MetodoPagoGasto;
    compraMateriaPrima?: {
      materiaPrimaId: string;
      cantidadComprada: number;
      actualizarCostoUnitario: boolean;
    };
  }
  ```
- `ResumenGastos`:
  ```ts
  export interface ResumenGastos {
    totalGastos: number;
    totalMateriaPrima: number;
    totalOperativos: number;
    totalEfectivo: number;
    totalTransferencia: number;
    cantidadGastos: number;
  }
  ```

### B. Servicios de Dominio (`src/domain/services/gastoServicio.ts`)
- `calcularResumenGastos(gastos: Gasto[]): ResumenGastos`:
  Calcula sumatorias totales, desagregadas por categoría y método de pago.
- `calcularNuevoCostoUnitario(monto: number, cantidad: number): number`:
  Calcula $\frac{\text{monto}}{\text{cantidad}}$ redondeado a 4 decimales.
- `filtrarGastos(gastos: Gasto[], categoria?: CategoriaGastoFiltro, metodo?: 'Todos' | MetodoPagoGasto, busqueda?: string): Gasto[]`:
  Aplica filtros de forma pura e inmutable.
- `validarNuevoGasto(input: NuevoGastoInput): { valido: boolean; error?: string }`:
  Valida concepto no vacío, monto > 0, fecha válida y consistencia de compra de insumos.

---

## 3. Capa de Infraestructura (`src/infrastructure/`)

### Repositorio `gastoRepositorio.ts`
- **Postgres Table `gastos`:**
  - `id`: UUID
  - `fecha`: DATE
  - `concepto`: VARCHAR(200)
  - `categoria`: VARCHAR(50) (con `CHECK (categoria IN ('Materia Prima', 'Packaging', 'Servicios', 'Equipamiento', 'Otros'))`)
  - `monto`: NUMERIC(12, 2)
  - `created_at`: TIMESTAMPTZ
- **Persistencia de Metadatos:**
  - Métodos `obtenerMetadatosGasto(gastoId)` y `guardarMetadatosGasto(gastoId, metadatos)` usando almacenamiento local y codificación segura para método de pago y detalle de compra.
- **Operaciones:**
  - `listar(): Promise<Gasto[]>`: Ordenado por `fecha` DESC y `created_at` DESC.
  - `registrarGasto(input: NuevoGastoInput, materiaPrimaActual?: MateriaPrima): Promise<Gasto>`:
    1. Inserta el gasto en `gastos`.
    2. Si tiene `compraMateriaPrima` vinculada, actualiza en `materias_primas`:
       - `stock_actual = stock_actual + cantidadComprada`.
       - Si `actualizarCostoUnitario === true`: `costo_unitario = nuevoCosto`.
    3. Rollback defensivo: ante falla en `materias_primas`, elimina el gasto insertado.
  - `eliminarGasto(gastoId: string, materiaPrimaActual?: MateriaPrima): Promise<void>`:
    1. Si tenía compra de materia prima, restituye el stock restando la cantidad (`max(0, stock - cantidad)`).
    2. Elimina la fila de `gastos`.

---

## 4. Capa de Aplicación (`src/presentation/hooks/`)

### Hook `useGastos.ts`
- Expone:
  - `gastos: Gasto[]`
  - `resumen: ResumenGastos`
  - `cargando: boolean`
  - `error: string | null`
  - `registrarGasto(input: NuevoGastoInput, materiaPrima?: MateriaPrima): Promise<Gasto>`
  - `eliminarGasto(gastoId: string, materiaPrima?: MateriaPrima): Promise<void>`
  - `recargar(): Promise<void>`

---

## 5. Capa de Presentación (`src/presentation/components/`)

### A. `ModalNuevoGasto.tsx`
- Accesibilidad: `role="dialog"`, `aria-modal="true"`, foco automático en el primer input, cierre con `Escape`.
- Selector de Categoría (`Materia Prima`, `Packaging`, `Servicios`, `Equipamiento`, `Otros`).
- Bloque dinámico para Materia Prima: selector de insumo, cantidad ingresada, preview del nuevo costo y switch para actualizar costo.
- Monto, Concepto, Fecha, Método de Pago (Efectivo / Transferencia).
- Cumplimiento de los 5 estados UI en todos los controles interactivos.

### B. `ListaGastos.tsx`
- Métricas superiores (Total Egresos, Materia Prima, Operativos, Efectivo vs Transferencia).
- Buscador y chips de filtrado.
- Listado cronológico de egresos con badges semánticos e indicación de impacto en stock.
- Botón de anular gasto con confirmación modal.

---

## 6. Integración en `App.tsx` y Solapa Finanzas
- Conexión de `ListaGastos` y `ModalNuevoGasto` en la solapa "Gastos".
- Recarga reactiva de `useMateriasPrimas` cuando se registra o elimina una compra de insumos.
- Enlace al balance general de la solapa "Finanzas":
  $\text{Ganancia Neta} = \text{Ventas Cobradas} - \text{Gastos Totales}$.
