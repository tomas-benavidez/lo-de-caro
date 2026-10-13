# Lista de Tareas: Módulo de Autenticación y Login (SPEC-006)

- **Identificador:** `SPEC-006`
- **Módulo:** Autenticación y Control de Acceso

---

## Tareas Atómicas de Implementación

- [x] **Tarea 1: Modelo de Dominio de Autenticación**
  - Archivo: `src/domain/models/auth.ts`
  - Definir interfaces `Usuario`, `CredencialesLogin` y tipos de error.
  - Función pura de validación de formato de email y credenciales (`validarCredenciales`, `mapearErrorAuth`).
  - Pruebas unitarias de dominio: 13/13 pasando en Vitest (`tests/domain/authServicio.test.ts`), incluyendo límites de tasa, null-safety y normalización.

- [x] **Tarea 2: Repositorio de Infraestructura `AuthRepositorio` con TDD**
  - Pruebas: `tests/infrastructure/authRepositorio.test.ts` (13/13 pasando).
  - Implementación: `src/infrastructure/repositories/authRepositorio.ts`
  - Manejo de `signInWithPassword`, `signOut`, `obtenerSesion`, `alCambiarEstadoAuth`.
  - Mapeo de errores de Supabase a español ("Invalid login credentials" -> "El correo electrónico o la contraseña son incorrectos").

- [x] **Tarea 3: Hook de Ciclo de Vida de Autenticación `useAuth`**
  - Archivo: `src/presentation/hooks/useAuth.ts`
  - Manejo de `usuario`, `cargandoSesion`, `errorAuth`, `iniciarSesion`, `cerrarSesion`, `limpiarError`.
  - Suscripción reactiva limpia a cambios de sesión con desuscripción al desmontar.
  - Cierre de sesión seguro con garantía de limpieza local en `finally` incluso sin conectividad.

- [x] **Tarea 4: Componente `PantallaLogin` con 5 Estados UI y Personaje Principal**
  - Archivo: `src/presentation/components/PantallaLogin.tsx`
  - Mobile-first con vista centrada en desktop.
  - Imagen `/personajes/personaje_principal.png`.
  - Titular institucional "Lo de Caro — Comida Casera" y subtítulo "Ingresá a tu panel de gestión".
  - Campos de Correo y Contraseña con toggle de visibilidad y 5 estados UI (`Default`, `Hover`, `Active`, `Focus :focus-visible`, `Disabled`).
  - Atributos para teclado móvil (`autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`).
  - Botón "Ingresar" con estado de carga ("Ingresando...").
  - Ausencia absoluta de enlaces o formularios de registro (acceso privado exclusivo).

- [x] **Tarea 5: Modularización de `PanelPrincipal` y Protección Raíz en `App.tsx`**
  - Archivos: `src/presentation/components/PanelPrincipal.tsx`, `src/App.tsx`
  - Mover la lógica de solapas y hooks de datos de negocio a `PanelPrincipal`.
  - En `App.tsx`: Si `cargandoSesion`, mostrar spinner de marca; si `!usuario`, renderizar exclusivamente `PantallaLogin`; si hay sesión, renderizar `PanelPrincipal` con botón de cerrar sesión en la barra superior. CERO llamadas o montaje de datos de negocio sin autenticación.

- [x] **Tarea 6: Verificación Integral, Pruebas y Auditoría DevTools**
  - Ejecutar `npm test`: 179/179 tests pasando exitosamente (0 fallas).
  - Ejecutar `npm run build` (`tsc && vite build`): compilación limpia, exit code 0.
  - Probar en caliente en navegador vía Chrome DevTools MCP en `http://localhost:5173/` (0 errores de consola, árbol de accesibilidad WAI-ARIA verificado, captura de pantalla generada en `evidencia_pantalla_login.png`).
  - Actualizar `REPORTE_VERIFICACION_SDD.md` y `docs/especificacion_tecnica.md`.
