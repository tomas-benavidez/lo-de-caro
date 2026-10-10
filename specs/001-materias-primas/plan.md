# Plan Técnico de Arquitectura: Módulo de Materias Primas

- **Identificador:** `PLAN-001`
- **Módulo:** Materias Primas
- **Enfoque:** Arquitectura Limpia + Ponytail (Cero complejidad accidental)

---

## 1. Diseño por Capas

```
[ UI React Mobile-First ] 
       │
       ▼
[ Custom Hook: useMateriasPrimas ] ──► (Application Layer)
       │
       ▼
[ Repositorio: materiaPrimaRepositorio ] ──► (Infrastructure Layer)
       │
       ▼
[ Supabase PostgreSQL (materias_primas) ] ──► (Database)
```

### Capa de Dominio (`src/domain/`)
* Reutiliza el modelo existente en `src/domain/models/materiaPrima.ts`.
* Reutiliza `evaluarEstadoStock()` en `src/domain/services/calculadorCostos.ts`.

### Capa de Infraestructura (`src/infrastructure/`)
* Archivo: `src/infrastructure/repositories/materiaPrimaRepositorio.ts`.
* Responsabilidad: Interactuar con la tabla `materias_primas` de Supabase a través del cliente oficial `@supabase/supabase-js`.
* Métodos: `listarMateriasPrimas()`, `crearMateriaPrima(datos)`.

### Capa de Presentación (`src/presentation/`)
* `src/presentation/hooks/useMateriasPrimas.ts`: Maneja estado de carga, errores y mutaciones sin ensuciar los componentes.
* `src/presentation/components/ListaMateriasPrimas.tsx`: Renderiza el listado mobile-first.
* `src/presentation/components/ModalNuevaMateriaPrima.tsx`: Modal con formulario accesible y los 5 estados obligatorios.

---

## 2. Filosofía Ponytail Aplicada
* **YAGNI:** No usamos Redux, Zustand ni bibliotecas pesadas de formularios. Un custom hook de React estándar resuelve el estado con menos de 40 líneas.
* **Componentes Nativos:** Formularios HTML estándar con validación nativa y estilos de Tailwind CSS.
