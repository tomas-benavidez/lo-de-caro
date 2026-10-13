# Plan de Implementación: Módulo de Autenticación y Login (SPEC-006)

- **Identificador:** `SPEC-006`
- **Módulo:** Autenticación y Control de Acceso
- **Arquitectura:** Hexagonal / Screaming Architecture (Dominio, Infraestructura, Aplicación, Presentación)

---

## 1. Estrategia de Diseño y Arquitectura

### 1.1 Prevención de Fugas de Información (Gating de Nivel Raíz)
Para cumplir con el requerimiento de que ningún dato de recetas ni costos se solicite antes de loguearse:
- El componente `App.tsx` actuará como el *Authentication Gatekeeper*.
- Si la sesión está en proceso de verificación inicial (`cargandoSesion`), se muestra un spinner con la marca.
- Si no hay sesión válida (`!usuario`), se renderiza exclusivamente `PantallaLogin`.
- El montaje de las solapas de negocio (`useMateriasPrimas`, `useProductosRecetas`, `useProduccion`, `useVentasCobranzas`, `useGastos`) se delega a `PanelPrincipal.tsx`. Al no montarse este componente cuando el usuario no está autenticado, React no ejecuta los `useEffect` que consultan a Supabase.

### 1.2 Capas y Responsabilidades
1. **Dominio (`src/domain/models/auth.ts`):**
   - Interfaces `Usuario`, `CredencialesLogin` y tipos de error de autenticación.
2. **Infraestructura (`src/infrastructure/repositories/authRepositorio.ts`):**
   - Conexión con `supabase.auth` (`signInWithPassword`, `signOut`, `getSession`, `onAuthStateChange`).
   - Mapeador de códigos y mensajes de error en español (`mapearErrorAuth`).
3. **Presentación - Hook (`src/presentation/hooks/useAuth.ts`):**
   - Estado de sesión, usuario activo, carga inicial y funciones de acción (`iniciarSesion`, `cerrarSesion`).
4. **Presentación - Componentes:**
   - `src/presentation/components/PantallaLogin.tsx`: Formulario centrado, mobile-first, con los 5 estados UI y personaje principal.
   - `src/presentation/components/PanelPrincipal.tsx`: Contenedor de la aplicación de gestión con botón de cierre de sesión en la cabecera.
   - `src/App.tsx`: Enrutador condicional raíz basado en el estado de autenticación.

---

## 2. Metodología de Desarrollo: TDD

1. **Fase RED:**
   - Escribir `tests/infrastructure/authRepositorio.test.ts` cubriendo login exitoso, credenciales inválidas, errores de red y cierre de sesión.
   - Ejecutar pruebas y confirmar fallo esperado.
2. **Fase GREEN:**
   - Implementar `auth.ts` y `authRepositorio.ts`.
   - Implementar `useAuth.ts`.
   - Ejecutar pruebas y verificar paso limpio.
3. **Fase REFACTOR & UI:**
   - Construir `PantallaLogin.tsx` con estilos Tailwind y accesibilidad.
   - Modularizar `PanelPrincipal.tsx` y conectar con `App.tsx`.
   - Ejecutar suite completa de tests de Vitest.
4. **Fase E2E / DevTools:**
   - Iniciar dev server y validar en navegador con Chrome DevTools.
   - Probar validación de campos, error de credenciales y navegación.
