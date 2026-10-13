# Especificación Funcional: Módulo de Autenticación y Control de Acceso (Login)

- **Identificador:** `SPEC-006`
- **Módulo:** Autenticación y Protección de Datos (Login Privado)
- **Estado:** Listo para Implementación
- **Depende de:** Configuración de Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

---

## 1. Objetivo y Contexto de Negocio

"Lo de Caro" almacena información comercial crítica y sensible: recetas exclusivas, costos unitarios de insumos, márgenes de ganancia calculados, registros de producción, saldos pendientes de clientes y balance financiero real.

La dueña (Caro) necesita una barrera de acceso robusta que impida a cualquier tercero o cliente curioso visualizar las recetas o los márgenes simplemente accediendo a la URL de la aplicación.

Por definición del negocio:
1. **Acceso Privado y Exclusivo:** No existe autoservicio de registro ("Crear cuenta" / "Registrarse"). La cuenta de administración es única y se provisiona directamente en el panel de autenticación de Supabase (`auth.users`).
2. **Cero Exposición de Datos sin Sesión:** Si no hay una sesión activa y válida, NINGÚN dato de la aplicación (ingredientes, recetas, lotes, ventas, clientes, gastos) debe cargarse ni montarse en memoria ni solicitarse a la API de Supabase.
3. **Identidad Visual Agradable y Clara:** La pantalla de bienvenida debe mostrar la identidad de marca de "Lo de Caro" con su paleta de colores oficial y la ilustración de la cocinera (`/personajes/personaje_principal.png`).
4. **Cierre de Sesión Accesible:** Un botón en la barra superior que permita a Caro salir de su sesión en cualquier momento.

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Verificación de Sesión Inicial (Splash de Carga)
* **Ubiquitous:** Al iniciar la aplicación, el sistema debe consultar a Supabase Auth si existe una sesión persistida válida en el almacenamiento local.
* **State-driven:** Mientras se verifica el estado de la sesión (`cargandoSesion = true`), el sistema debe renderizar exclusivamente un indicador de carga limpio con la estética de la marca ("Cargando Lo de Caro..."), sin montar ni consultar ningún módulo del negocio.

### RF-02: Barrera de Acceso y Renderizado Exclusivo de Login
* **State-driven:** Si no existe una sesión activa y autenticada (`usuario = null`), el sistema debe renderizar ÚNICA Y EXCLUSIVAMENTE el componente `PantallaLogin`.
* **Ubiquitous:** Ningún hook de consulta de datos (`useMateriasPrimas`, `useProductosRecetas`, `useProduccion`, `useVentasCobranzas`, `useGastos`) debe ejecutarse ni solicitar datos a Supabase antes de que el usuario esté debidamente autenticado.

### RF-03: Formulario de Inicio de Sesión
* **Event-driven:** El usuario ingresa su correo electrónico y contraseña y pulsa "Ingresar":
  1. Validación en frontend de campos requeridos y formato de correo electrónico.
  2. Invocación a `supabase.auth.signInWithPassword({ email, password })`.
  3. Deshabilitación de campos y botón con indicador de carga durante la autenticación ("Ingresando...").
  4. Si las credenciales son válidas, Supabase actualiza la sesión y la aplicación transiciona automáticamente al panel principal.
  5. Si las credenciales son inválidas, se presenta un mensaje claro en español: *"El correo electrónico o la contraseña son incorrectos"*.
  6. En caso de fallas de red, se muestra un mensaje informativo claro: *"No se pudo conectar con el servidor. Revisá tu conexión a internet"*.

### RF-04: Cierre de Sesión Seguro
* **Event-driven:** Al pulsar el botón "Cerrar sesión" en la cabecera superior, el sistema invoca `supabase.auth.signOut()`, limpia el estado del usuario en memoria y transiciona inmediatamente a `PantallaLogin`.

### RF-05: Diseño y Accesibilidad (5 Estados UI)
* **Ubiquitous:** Todos los elementos interactivos del formulario (inputs, botón de envío, botón de alternar visibilidad de contraseña, botón de cerrar sesión) deben implementar estrictamente los 5 estados UI:
  1. `Default`
  2. `Hover`
  3. `Active`
  4. `Focus` (`:focus-visible` de alto contraste, operable 100% por teclado)
  5. `Disabled`
* **Ubiquitous:** La ilustración `personaje_principal.png` debe presentarse de forma destacada sobre fondo suave beige (`bg-marca-beige`), acompañada por los titulares "Lo de Caro — Comida Casera" y "Ingresá a tu panel de gestión".

---

## 3. Criterios de Aceptación (DoD)

1. [x] Servicio `authRepositorio` implementado con cobertura unitaria completa en Vitest (mocking de Supabase Auth).
2. [x] Mapeo de errores de autenticación a mensajes amigables en español.
3. [x] Hook `useAuth` implementado para gestionar reactivamente el ciclo de vida de la sesión (`getSession`, `onAuthStateChange`).
4. [x] Separación de `PanelPrincipal` para garantizar cero llamadas a tablas de negocio cuando no hay sesión.
5. [x] Componente `PantallaLogin` con 5 estados en cada control, WAI-ARIA, e imagen `personaje_principal.png`.
6. [x] Botón accesible "Cerrar sesión" en el header principal.
7. [x] Pruebas unitarias pasando al 100% (`npm test`).
8. [x] Compilación limpia en TypeScript y Vite (`tsc && vite build`).
9. [x] Verificación en vivo en navegador con DevTools (0 errores de consola, árbol de accesibilidad validado).
