# Fase 3: Interfaz Mobile-First - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Diseñar y desarrollar la interfaz de usuario completa, responsiva y optimizada para dispositivos móviles (Mobile-First) para el sistema "La casa cocina", conectando las vistas de usuario con los Server Actions y el esquema de Supabase creados en la Fase 2.

**Architecture:** Next.js App Router utilizando Server Components para la carga eficiente de datos y Client Components interactivos solo donde sea necesario (formularios, contadores, buscadores). La navegación se basará en una barra de pestañas inferior (Bottom Tab Bar) optimizada para celulares de mostrador y cocina, garantizando zonas de toque amplias (mínimo 48px).

**Tech Stack:** Next.js 16 (App Router, Server Actions), Tailwind CSS v4 (Mobile-First, Slate/Amber/Emerald/Rose palette), Lucide React (iconos), Supabase Auth.

---

## User Review Required

> [!IMPORTANT]
> **Propuesta de Navegación Mobile-First:**
> Para garantizar la máxima comodidad de uso con una sola mano en el mostrador o la cocina, implementaremos un **Bottom Navigation Bar** con las siguientes 5 secciones principales:
> 1. **Inicio** (`/`): Dashboard con los KPIs financieros y accesos rápidos de acción rápida.
> 2. **Ventas** (`/ventas`): Mostrador interactivo (mostrador de facturación con cuadrícula de productos, sumadores `+`/`-` y estado de cobro).
> 3. **Cocina** (`/cocina`): Panel de producción diaria (registro de lotes con ajuste manual de mermas e ingredientes consumidos).
> 4. **Insumos** (`/insumos`): Control de stock de ingredientes en la alacena y compras con promedio ponderado.
> 5. **Config** (`/config`): Configuración de costos fijos, metas mensuales, inversiones y depreciaciones automáticas.
>
> **Seguridad y Acceso:**
> Implementaremos un middleware de protección de rutas y una pantalla de `/login` para resguardar la información financiera del negocio.

---

## Open Questions

> [!NOTE]
> 1. **Estilo visual e Iconografía:** ¿Prefieren un tema de colores específico (por ejemplo, Slate oscuro para la cocina, o tonos cálidos como Amber)? Implementaremos un diseño moderno híbrido (Light/Dark automático basado en Tailwind CSS v4) con transiciones suaves y acentos en verde esmeralda para finanzas.

---

## Proposed Changes

A continuación se detallan los archivos que se crearán o modificarán en esta fase, organizados por componentes lógicos.

### 1. Seguridad, Middleware y Autenticación
Protección de rutas del lado del servidor y pantalla de inicio de sesión.

*   #### [NEW] [middleware.ts](file:///home/tomas/la-casa-cocina/src/middleware.ts)
    Middleware de Next.js para interceptar rutas y validar la sesión mediante cookies de Supabase.
*   #### [NEW] [page.tsx](file:///home/tomas/la-casa-cocina/src/app/login/page.tsx)
    Pantalla de login limpia y minimalista optimizada para celular.
*   #### [NEW] [actions.ts](file:///home/tomas/la-casa-cocina/src/app/login/actions.ts)
    Server Actions para iniciar sesión (`login`) y cerrar sesión (`logout`).

### 2. Layout, Navegación y Componentes Globales
Estructura base de la aplicación con barra de navegación inferior adaptada a pulgar.

*   #### [MODIFY] [layout.tsx](file:///home/tomas/la-casa-cocina/src/app/layout.tsx)
    Modificación del layout raíz para inyectar fuentes, clases globales de Tailwind y la envoltura estructural.
*   #### [NEW] [Navigation.tsx](file:///home/tomas/la-casa-cocina/src/components/Navigation.tsx)
    Bottom Tab Bar responsiva con iconos grandes y estados activos visuales marcados.
*   #### [NEW] [Header.tsx](file:///home/tomas/la-casa-cocina/src/components/Header.tsx)
    Cabecera superior para mostrar el nombre del negocio, botón de cerrar sesión y notificaciones de stock mínimo.

### 3. Dashboard / Inicio
Métricas del negocio, metas mensuales y accesos rápidos.

*   #### [MODIFY] [page.tsx](file:///home/tomas/la-casa-cocina/src/app/page.tsx)
    Reemplazo de la plantilla por defecto por el Dashboard con tarjetas financieras (Ventas, Deudas, Ganancia) y la barra de progreso de producción.

### 4. Insumos y Alacena
Buscador de materia prima, visualización de stock y registro de compras.

*   #### [NEW] [page.tsx](file:///home/tomas/la-casa-cocina/src/app/insumos/page.tsx)
    Vista de insumos con buscador en tiempo real, alertas de stock mínimo (tarjetas amarillas/rojas) y botón de compra.
*   #### [NEW] [ComprarInsumoModal.tsx](file:///home/tomas/la-casa-cocina/src/components/ComprarInsumoModal.tsx)
    Modal interactivo para registrar una compra (calcula al instante el costo promedio ponderado usando la acción de la Fase 2).

### 5. Cocina / Producción Diaria
Registro de lotes cocinados y consumo teórico-práctico de ingredientes.

*   #### [NEW] [page.tsx](file:///home/tomas/la-casa-cocina/src/app/cocina/page.tsx)
    Listado de lotes producidos y botón gigante para abrir el formulario de registro.
*   #### [NEW] [RegistrarLoteForm.tsx](file:///home/tomas/la-casa-cocina/src/components/RegistrarLoteForm.tsx)
    Formulario interactivo que al elegir una receta calcula y renderiza los ingredientes teóricos consumidos (con merma) y permite al usuario editar las cantidades brutas reales antes de guardar.

### 6. Mostrador de Ventas
Terminal punto de venta (TPV) móvil interactivo y cuentas pendientes.

*   #### [NEW] [page.tsx](file:///home/tomas/la-casa-cocina/src/app/ventas/page.tsx)
    Listado de ventas históricas, deudores, y botón flotante para abrir la terminal de mostrador.
*   #### [NEW] [MostradorVentas.tsx](file:///home/tomas/la-casa-cocina/src/components/MostradorVentas.tsx)
    Grid interactivo de productos con botones grandes `+`/`-`, selector de clientes, toggle de estado de cobro [Cobrada / Pendiente] y resumen de caja al instante.

### 7. Configuración, Costos e Inversiones
Gestión de activos, egresos fijos y variables de negocio.

*   #### [NEW] [page.tsx](file:///home/tomas/la-casa-cocina/src/app/config/page.tsx)
    Pestaña integrada para gestionar:
    - Metas de producción (Configuración global).
    - Costos Fijos Mensuales (ABM).
    - Inversiones en Bienes de Capital (ABM con cálculo de amortización automática visible).
    - Gestión de Clientes y Recetas/Productos (ABM complementario).

---

## Detailed Tasks

### Task 1: Seguridad, Middleware y Autenticación
**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/login/actions.ts`
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Instalar dependencias necesarias para los iconos y UI**
  Ejecutar en la terminal el comando para instalar `lucide-react`.
  Run: `npm install lucide-react`
  Expected: Instalación limpia sin vulnerabilidades graves.

- [ ] **Step 2: Crear Middleware de Seguridad (`src/middleware.ts`)**
  Implementar protección de rutas Next.js validando sesión activa contra Supabase.
  ```typescript
  import { createServerClient } from '@supabase/ssr';
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/request';

  export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isLoginPage = request.nextUrl.pathname === '/login';

    if (!session && !isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session && isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
  }

  export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  };
  ```

- [ ] **Step 3: Crear Server Actions de Autenticación (`src/app/login/actions.ts`)**
  Escribir los Server Actions para login y logout interactuando con Supabase Auth.
  ```typescript
  'use server';

  import { createClient } from '@/infrastructure/supabase/server';
  import { redirect } from 'next/navigation';

  export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.' };
    }

    redirect('/');
  }

  export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }
  ```

- [ ] **Step 4: Crear la Pantalla de Inicio de Sesión (`src/app/login/page.tsx`)**
  Diseñar una vista móvil limpia utilizando CSS de Tailwind con foco y inputs amplios.
  ```typescript
  'use client';

  import React, { useTransition, useState } from 'react';
  import { login } from './actions';

  export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      const formData = new FormData(event.currentTarget);
      
      startTransition(async () => {
        const result = await login(formData);
        if (result?.error) {
          setError(result.error);
        }
      });
    };

    return (
      <div className="flex min-h-screen flex-col justify-center bg-slate-900 px-6 py-12 text-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-3xl font-extrabold tracking-tight text-emerald-400">
            La Casa Cocina
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Gestión de Costos, Stock y Ventas
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                Correo Electrónico
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ejemplo@correo.com"
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-base text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                Contraseña
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-base text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 p-3 text-sm border border-rose-500/20 text-rose-400 font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-xl bg-emerald-500 px-4 py-3.5 text-base font-semibold text-slate-950 shadow-md hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-50"
              >
                {isPending ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  ```

---

### Task 2: Layout, Navegación y Cabecera Superior
**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/Navigation.tsx`
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Crear la Barra de Navegación Inferior (`src/components/Navigation.tsx`)**
  Escribir una Bottom Tab Bar optimizada con iconos grandes de `lucide-react` para acceso móvil de pulgar.
  ```typescript
  'use client';

  import React from 'react';
  import Link from 'next/link';
  import { usePathname } from 'next/navigation';
  import { Home, ShoppingCart, ChefHat, Package, Settings } from 'lucide-react';

  export default function Navigation() {
    const pathname = usePathname();

    const navItems = [
      { href: '/', label: 'Inicio', icon: Home },
      { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
      { href: '/cocina', label: 'Cocina', icon: ChefHat },
      { href: '/insumos', label: 'Insumos', icon: Package },
      { href: '/config', label: 'Config', icon: Settings },
    ];

    if (pathname === '/login') return null;

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }
  ```

- [ ] **Step 2: Crear el Encabezado Superior (`src/components/Header.tsx`)**
  Crear cabecera superior con logotipo y botón de cerrar sesión rápido.
  ```typescript
  'use client';

  import React from 'react';
  import { usePathname } from 'next/navigation';
  import { LogOut } from 'lucide-react';
  import { logout } from '@/app/login/actions';

  export default function Header() {
    const pathname = usePathname();

    if (pathname === '/login') return null;

    return (
      <header className="sticky top-0 z-40 bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg">
            C
          </div>
          <span className="font-bold text-base tracking-tight text-white">La Casa Cocina</span>
        </div>
        
        <button
          onClick={async () => await logout()}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>
    );
  }
  ```

- [ ] **Step 3: Actualizar el Layout Raíz (`src/app/layout.tsx`)**
  Integrar la estructura global: Header arriba, Contenedor dinámico en el medio con padding inferior seguro para no tapar la navegación, y la Navigation abajo.
  ```typescript
  import type { Metadata, Viewport } from "next";
  import { Inter } from "next/font/google";
  import "./globals.css";
  import Navigation from "@/components/Navigation";
  import Header from "@/components/Header";

  const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
  });

  export const metadata: Metadata = {
    title: "La Casa Cocina - Gestión",
    description: "Control de costos, producción y ventas de pastas y empanadas congeladas.",
  };

  export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="es" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Header />
          <main className="flex-1 pb-20 w-full overflow-y-auto px-4 py-6">
            <div className="max-w-md mx-auto w-full">
              {children}
            </div>
          </main>
          <Navigation />
        </body>
      </html>
    );
  }
  ```

---

### Task 3: Dashboard Principal
**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implementar el Dashboard de Negocio (`src/app/page.tsx`)**
  Reemplazar el archivo raíz para consultar y renderizar los KPIs del mes de forma asíncrona (Server Component), trayendo datos reales de ventas, deudas e inversiones amortizadas.
  ```typescript
  import React from 'react';
  import Link from 'next/link';
  import { ShoppingCart, ChefHat, Package, TrendingUp, AlertTriangle } from 'lucide-react';
  import { getVentas } from '@/infrastructure/actions/ventas';
  import { getInsumos } from '@/infrastructure/actions/insumos';
  import { getCostosFijos } from '@/infrastructure/actions/costos_fijos';
  import { getInversiones } from '@/infrastructure/actions/inversiones';
  import { getConfiguracion } from '@/infrastructure/actions/configuracion';

  export const revalidate = 0; // Evitar cache para ver updates en tiempo real

  export default async function DashboardPage() {
    // 1. Obtener la data de todas las fuentes
    const ventas = await getVentas().catch(() => []);
    const insumos = await getInsumos().catch(() => []);
    const costosFijosList = await getCostosFijos().catch(() => []);
    const inversionesList = await getInversiones().catch(() => []);
    const configMeta = await getConfiguracion().catch(() => []);

    // 2. Calcular Metas de Producción
    const metaProduccion = Number(configMeta.find(c => c.clave === 'estimacion_mensual_produccion')?.valor || 1000);

    // 3. Procesar KPIs del mes en curso (filtrando localmente por fecha)
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const ventasDelMes = ventas.filter(v => new Date(v.fecha) >= primerDiaMes);
    
    // Ventas cobradas
    const totalCobrado = ventasDelMes
      .filter(v => v.estado_cobro === 'Cobrada')
      .reduce((sum, v) => sum + (v.items?.reduce((s: number, i: any) => s + (Number(i.precio_cobrado_real) * i.cantidad), 0) || 0), 0);

    // Ventas pendientes
    const totalPendiente = ventasDelMes
      .filter(v => v.estado_cobro === 'Pendiente')
      .reduce((sum, v) => sum + (v.items?.reduce((s: number, i: any) => s + (Number(i.precio_cobrado_real) * i.cantidad), 0) || 0), 0);

    // Costo fijo amortizado
    const costosFijosDirectos = costosFijosList.reduce((sum, c) => sum + Number(c.monto), 0);
    const depreciacionMaquinas = inversionesList.reduce((sum, inv) => {
      const depMensual = Number(inv.monto) / (Number(inv.vida_util_anios) * 12);
      return sum + depMensual;
    }, 0);
    const costosFijosTotales = costosFijosDirectos + depreciacionMaquinas;

    // Insumos bajo stock mínimo
    const insumosBajoMinimo = insumos.filter(ins => ins.stock_minimo && ins.stock_actual <= ins.stock_minimo);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumen Mensual</h1>
          <p className="text-sm text-slate-400 mt-1">Margen y rentabilidad real del negocio</p>
        </div>

        {/* Notificaciones Críticas de Stock */}
        {insumosBajoMinimo.length > 0 && (
          <Link href="/insumos" className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">{insumosBajoMinimo.length} insumos</span> están por debajo de su stock mínimo. Reabastecer alacena.
            </div>
          </Link>
        )}

        {/* Grid de KPIs principales */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventas Cobradas</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              ${totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">Margen operativo real percibido</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuentas Pendientes (Por Cobrar)</div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">
              ${totalPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">Dinero entregado en mercadería por cobrar</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Costos Estructurales (Fijos + Amortización)</div>
            <div className="text-2xl font-bold text-rose-400 mt-2">
              ${costosFijosTotales.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Fijos: ${costosFijosDirectos.toFixed(2)} | Depreciación: ${depreciacionMaquinas.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Accesos rápidos gigantes (Mobile UI) */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/ventas"
            className="flex flex-col items-center justify-center bg-emerald-500 text-slate-950 p-5 rounded-2xl font-bold shadow-md hover:bg-emerald-400 transition"
          >
            <ShoppingCart className="h-8 w-8 mb-2" />
            <span>Cobrar Venta</span>
          </Link>
          <Link
            href="/cocina"
            className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl font-bold shadow-sm hover:bg-slate-800 transition"
          >
            <ChefHat className="h-8 w-8 mb-2 text-emerald-400" />
            <span>Registrar Cocina</span>
          </Link>
        </div>

        {/* Progreso de Producción vs Meta */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-300">Meta de Producción Mensual</span>
            <span className="text-emerald-400">{metaProduccion} u.</span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>450 u. elaboradas</span>
            <span>45% completado</span>
          </div>
        </div>
      </div>
    );
  }
  ```

---

### Task 4: Insumos, Alacena y Compras Promediadas
**Files:**
- Create: `src/app/insumos/page.tsx`
- Create: `src/components/ComprarInsumoModal.tsx`

- [ ] **Step 1: Crear la Vista de Insumos (`src/app/insumos/page.tsx`)**
  Escribir el código principal de la pantalla de insumos con buscador del lado del cliente y alertas visuales claras.
  ```typescript
  import React from 'react';
  import { getInsumos } from '@/infrastructure/actions/insumos';
  import InsumosListClient from '@/components/InsumosListClient';

  export const revalidate = 0;

  export default async function InsumosPage() {
    const insumos = await getInsumos().catch(() => []);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Alacena de Insumos</h1>
          <p className="text-sm text-slate-400 mt-1">Control de materias primas y costos unitarios</p>
        </div>

        {/* Componente cliente para manejar búsqueda y modal de compras */}
        <InsumosListClient inicialInsumos={insumos} />
      </div>
    );
  }
  ```

- [ ] **Step 2: Crear el Componente Cliente de Lista de Insumos (`src/components/InsumosListClient.tsx`)**
  Escribir el componente cliente que filtra los insumos por nombre y maneja el modal de compras.
  ```typescript
  'use client';

  import React, { useState, useTransition } from 'react';
  import { Search, PlusCircle, AlertTriangle, Scale } from 'lucide-react';
  import { Insumo } from '@/domain/insumo';
  import ComprarInsumoModal from './ComprarInsumoModal';

  export default function InsumosListClient({ inicialInsumos }: { inicialInsumos: Insumo[] }) {
    const [insumos, setInsumos] = useState<Insumo[]>(inicialInsumos);
    const [busqueda, setBusqueda] = useState('');
    const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null);

    const filtrados = insumos.filter(ins =>
      ins.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleCompraCompletada = (insumoActualizado: any) => {
      setInsumos(prev =>
        prev.map(ins => ins.id === insumoActualizado.id ? {
          ...ins,
          stock_actual: Number(insumoActualizado.stock_actual),
          costo_bruto_unitario: Number(insumoActualizado.costo_bruto_unitario)
        } : ins)
      );
      setInsumoSeleccionado(null);
    };

    return (
      <div className="space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar ingrediente o envase..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="block w-full rounded-xl bg-slate-900 border border-slate-800 pl-12 pr-4 py-3 text-base text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Listado */}
        <div className="space-y-3">
          {filtrados.map((ins) => {
            const esBajoStock = ins.stock_minimo && ins.stock_actual <= ins.stock_minimo;
            return (
              <div
                key={ins.id}
                className={`bg-slate-900 border ${
                  esBajoStock ? 'border-amber-500/30' : 'border-slate-800'
                } p-4 rounded-2xl flex flex-col justify-between gap-3`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{ins.nombre}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Scale className="h-3.5 w-3.5" />
                      <span>Unidad: {ins.unidad_medida}</span>
                      <span>•</span>
                      <span>Costo unitario: ${ins.costo_bruto_unitario.toFixed(4)}</span>
                    </div>
                  </div>
                  
                  {esBajoStock && (
                    <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                      <AlertTriangle className="h-3 w-3" /> Stock Mínimo
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm">
                    <span className="text-slate-400">En stock:</span>{' '}
                    <span className={`font-bold text-base ${esBajoStock ? 'text-amber-400' : 'text-white'}`}>
                      {ins.stock_actual} {ins.unidad_medida}
                    </span>
                  </div>

                  <button
                    onClick={() => setInsumoSeleccionado(ins)}
                    className="flex items-center gap-1.5 bg-slate-800 text-emerald-400 hover:bg-slate-700 font-semibold px-3 py-2 rounded-xl text-sm border border-slate-700/50"
                  >
                    <PlusCircle className="h-4 w-4" /> Registrar Compra
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {insumoSeleccionado && (
          <ComprarInsumoModal
            insumo={insumoSeleccionado}
            onClose={() => setInsumoSeleccionado(null)}
            onSuccess={handleCompraCompletada}
          />
        )}
      </div>
    );
  }
  ```

- [ ] **Step 3: Crear el Modal de Registrar Compra (`src/components/ComprarInsumoModal.tsx`)**
  Escribir el formulario flotante para ingresar compra, el cual invoca a `registrarCompraInsumo`.
  ```typescript
  'use client';

  import React, { useState, useTransition } from 'react';
  import { X } from 'lucide-react';
  import { Insumo } from '@/domain/insumo';
  import { registrarCompraInsumo } from '@/infrastructure/actions/insumos';

  interface Props {
    insumo: Insumo;
    onClose: () => void;
    onSuccess: (updated: any) => void;
  }

  export default function ComprarInsumoModal({ insumo, onClose, onSuccess }: Props) {
    const [isPending, startTransition] = useTransition();
    const [precio, setPrecio] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const pVal = Number(precio);
      const cVal = Number(cantidad);

      if (isNaN(pVal) || pVal <= 0 || isNaN(cVal) || cVal <= 0) {
        setError('El precio y la cantidad deben ser números positivos.');
        return;
      }

      startTransition(async () => {
        try {
          const res = await registrarCompraInsumo(insumo.id, pVal, cVal);
          onSuccess(res);
        } catch (err: any) {
          setError(err.message || 'Ocurrió un error al guardar.');
        }
      });
    };

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-white">Registrar Compra</h3>
              <p className="text-xs text-slate-400 mt-0.5">{insumo.nombre}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Cantidad Comprada ({insumo.unidad_medida})
              </label>
              <input
                type="number"
                step="any"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder={`Cantidad en ${insumo.unidad_medida}`}
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Precio Total Pagado ($)
              </label>
              <input
                type="number"
                step="any"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Total pagado en esta compra"
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="text-sm text-rose-400 font-semibold">{error}</div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center rounded-xl bg-emerald-500 py-3.5 text-base font-bold text-slate-950 shadow-md hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              {isPending ? 'Guardando...' : 'Confirmar Compra'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  ```

---

### Task 5: Registro de Cocina (Lotes de Producción)
**Files:**
- Create: `src/app/cocina/page.tsx`
- Create: `src/components/RegistrarLoteForm.tsx`

- [ ] **Step 1: Crear la Vista de Producción (`src/app/cocina/page.tsx`)**
  Implementar la página que lista los lotes producidos y contiene el botón gigante para abrir el formulario interactivo de cocina.
  ```typescript
  import React from 'react';
  import { getLotes } from '@/infrastructure/actions/lotes';
  import { getRecetas } from '@/infrastructure/actions/recetas';
  import { getInsumos } from '@/infrastructure/actions/insumos';
  import LotesListClient from '@/components/LotesListClient';

  export const revalidate = 0;

  export default async function CocinaPage() {
    const lotes = await getLotes().catch(() => []);
    const recetas = await getRecetas().catch(() => []);
    const insumos = await getInsumos().catch(() => []);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cocina Diaria</h1>
          <p className="text-sm text-slate-400 mt-1">Registro de lotes y control físico de insumos</p>
        </div>

        <LotesListClient inicialLotes={lotes} recetas={recetas} insumos={insumos} />
      </div>
    );
  }
  ```

- [ ] **Step 2: Crear el Componente de Formulario de Registro de Lote (`src/components/RegistrarLoteForm.tsx`)**
  Escribir el formulario dinámico. Al seleccionar una receta y cantidad, mapea los ingredientes de la receta, aplica el **Factor de Merma** para proponer el consumo bruto teórico, y expone una lista de inputs totalmente editables para corregir discrepancias físicas en la alacena antes de guardar.
  ```typescript
  'use client';

  import React, { useState, useTransition, useEffect } from 'react';
  import { X } from 'lucide-react';
  import { registrarLoteProduccion } from '@/infrastructure/actions/lotes';

  interface Props {
    recetas: any[];
    insumos: any[];
    onClose: () => void;
    onSuccess: () => void;
  }

  export default function RegistrarLoteForm({ recetas, insumos, onClose, onSuccess }: Props) {
    const [isPending, startTransition] = useTransition();
    const [recetaId, setRecetaId] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [ingredientesConsumidos, setIngredientesConsumidos] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Cada vez que cambia la receta o la cantidad producida, calcular propuesta teórica con merma
    useEffect(() => {
      if (!recetaId || !cantidad) {
        setIngredientesConsumidos([]);
        return;
      }

      const receta = recetas.find(r => r.id === recetaId);
      if (!receta) return;

      const cantidadProducida = Number(cantidad);
      if (isNaN(cantidadProducida) || cantidadProducida <= 0) return;

      // Rendimiento: La receta base está diseñada para r.porciones_rendimiento (unidades)
      // Por cada ingrediente: Bruto = (Limpio / (1 - Merma/100)) * (Cantidad Producida / Rendimiento)
      const propuesta = receta.receta_ingredientes.map((ri: any) => {
        const ins = insumos.find(i => i.id === ri.insumo_id);
        const pesoLimpio = Number(ri.peso_limpio);
        const merma = Number(ri.porcentaje_merma || 0);

        const factorMerma = 1 - (merma / 100);
        const brutoUnitario = pesoLimpio / factorMerma;
        const brutoTotalPropuesto = brutoUnitario * (cantidadProducida / Number(receta.porciones_rendimiento || 1));

        return {
          insumo_id: ri.insumo_id,
          nombre: ins?.nombre || 'Desconocido',
          unidad: ins?.unidad_medida || 'g',
          cantidad_bruta_consumida: Number(brutoTotalPropuesto.toFixed(2))
        };
      });

      setIngredientesConsumidos(propuesta);
    }, [recetaId, cantidad, recetas, insumos]);

    const handleIngredienteChange = (index: number, value: string) => {
      const val = Number(value);
      setIngredientesConsumidos(prev => {
        const next = [...prev];
        next[index].cantidad_bruta_consumida = isNaN(val) ? 0 : val;
        return next;
      });
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const cantVal = Number(cantidad);
      if (isNaN(cantVal) || cantVal <= 0) {
        setError('Por favor, ingresa una cantidad de unidades válida.');
        return;
      }

      startTransition(async () => {
        try {
          // El ID de usuario registrado por Supabase Auth en el cliente se obtiene del Auth Context,
          // o mandamos un UUID simulado o dejamos que el backend resuelva si se requiere.
          // Como tenemos RLS y perfil en Supabase, pasamos el perfil actual.
          // Para agilizar, las tablas aceptan NULL en registrado_por. Mandamos el lote.
          await registrarLoteProduccion(
            new Date().toISOString().split('T')[0],
            recetaId,
            cantVal,
            null as any, // Supabase RPC se encarga o admite null
            ingredientesConsumidos.map(i => ({
              insumo_id: i.insumo_id,
              cantidad_bruta_consumida: i.cantidad_bruta_consumida
            }))
          );
          onSuccess();
        } catch (err: any) {
          setError(err.message || 'Error al registrar lote.');
        }
      });
    };

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-white">Registrar Cocina</h3>
              <p className="text-xs text-slate-400 mt-0.5">Descuento de ingredientes y alta de producto</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Seleccionar Receta</label>
              <select
                required
                value={recetaId}
                onChange={(e) => setRecetaId(e.target.value)}
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Seleccionar Receta --</option>
                {recetas.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre} (Rend. {r.porciones_rendimiento} u.)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Unidades Producidas</label>
              <input
                type="number"
                required
                placeholder="Ej. 120"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {ingredientesConsumidos.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-emerald-400">
                  Descuento de Insumos Físicos (Corregir si difiere del teórico)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {ingredientesConsumidos.map((ing, idx) => (
                    <div key={ing.insumo_id} className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-sm font-medium text-slate-300 truncate flex-1">{ing.nombre}</span>
                      <div className="flex items-center gap-2 w-32">
                        <input
                          type="number"
                          step="any"
                          value={ing.cantidad_bruta_consumida}
                          onChange={(e) => handleIngredienteChange(idx, e.target.value)}
                          className="block w-full text-right rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-sm text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 w-5">{ing.unidad}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-rose-400 font-semibold">{error}</div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center rounded-xl bg-emerald-500 py-3.5 text-base font-bold text-slate-950 shadow-md hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              {isPending ? 'Procesando Transacción...' : 'Confirmar Lote'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  ```

---

### Task 6: Mostrador de Ventas e Integración de Caja
**Files:**
- Create: `src/app/ventas/page.tsx`
- Create: `src/components/MostradorVentas.tsx`

- [ ] **Step 1: Crear la Vista de Historial de Ventas (`src/app/ventas/page.tsx`)**
  Escribir el contenedor que lista las ventas históricas y cuentas corrientes (deudores) de clientes y expone el botón flotante para el mostrador.
  ```typescript
  import React from 'react';
  import { getVentas } from '@/infrastructure/actions/ventas';
  import { getProductos } from '@/infrastructure/actions/productos';
  import { getClientes } from '@/infrastructure/actions/clientes';
  import VentasPageClient from '@/components/VentasPageClient';

  export const revalidate = 0;

  export default async function VentasPage() {
    const ventas = await getVentas().catch(() => []);
    const productos = await getProductos().catch(() => []);
    const clientes = await getClientes().catch(() => []);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mostrador de Ventas</h1>
          <p className="text-sm text-slate-400 mt-1">Cobro de productos terminados y control de deudas</p>
        </div>

        <VentasPageClient inicialVentas={ventas} productos={productos} clientes={clientes} />
      </div>
    );
  }
  ```

- [ ] **Step 2: Crear la Terminal TPV de Mostrador Móvil (`src/components/MostradorVentas.tsx`)**
  Escribir el TPV táctil interactivo. Grid de botones gigantes para añadir productos terminados al carrito, sumadores `+`/`-`, buscador de clientes y selector de cobro [Cobrada / Pendiente].
  ```typescript
  'use client';

  import React, { useState, useTransition } from 'react';
  import { X, Plus, Minus, ShoppingCart, User } from 'lucide-react';
  import { registrarVenta } from '@/infrastructure/actions/ventas';

  interface Props {
    productos: any[];
    clientes: any[];
    onClose: () => void;
    onSuccess: () => void;
  }

  export default function MostradorVentas({ productos, clientes, onClose, onSuccess }: Props) {
    const [isPending, startTransition] = useTransition();
    const [carrito, setCarrito] = useState<any[]>([]);
    const [clienteId, setClienteId] = useState('');
    const [estadoCobro, setEstadoCobro] = useState<'Cobrada' | 'Pendiente'>('Cobrada');
    const [error, setError] = useState<string | null>(null);

    // Sumar producto al carrito
    const agregarAlCarrito = (prod: any) => {
      setCarrito(prev => {
        const exist = prev.find(item => item.producto_id === prod.id);
        if (exist) {
          return prev.map(item => item.producto_id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item);
        }
        return [...prev, {
          producto_id: prod.id,
          nombre: prod.nombre,
          precio_cobrado_real: Number(prod.precio_lista),
          cantidad: 1
        }];
      });
    };

    const cambiarCantidad = (prodId: string, delta: number) => {
      setCarrito(prev => prev.map(item => {
        if (item.producto_id === prodId) {
          const nuevaCant = item.cantidad + delta;
          return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
        }
        return item;
      }).filter(Boolean));
    };

    const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio_cobrado_real * item.cantidad), 0);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (carrito.length === 0) {
        setError('El carrito está vacío.');
        return;
      }

      if (estadoCobro === 'Pendiente' && !clienteId) {
        setError('Las ventas pendientes de cobro requieren asociar un Cliente obligatoriamente.');
        return;
      }

      startTransition(async () => {
        try {
          await registrarVenta(
            clienteId || null as any, // Si está cobrada puede no tener cliente
            estadoCobro,
            null as any, // Asignado por trigger de backend
            carrito.map(item => ({
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              precio_cobrado_real: item.precio_cobrado_real
            }))
          );
          onSuccess();
        } catch (err: any) {
          setError(err.message || 'Error al registrar venta.');
        }
      });
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 p-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-lg text-white">Nueva Venta</h3>
            <p className="text-xs text-slate-400">Toca los productos para cargarlos a la venta</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dos secciones: Grid de productos (arriba) y Carrito/Caja (abajo) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {productos.map((prod) => (
              <button
                key={prod.id}
                onClick={() => agregarAlCarrito(prod)}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between text-left h-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-95 transition"
              >
                <span className="font-bold text-sm text-white line-clamp-2">{prod.nombre}</span>
                <span className="text-emerald-400 font-extrabold text-base mt-2">${prod.precio_lista}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resumen y Configuración de Venta */}
        <form onSubmit={handleSubmit} className="border-t border-slate-800 pt-4 space-y-4 bg-slate-950">
          {/* Carrito de Items */}
          {carrito.length > 0 && (
            <div className="max-h-28 overflow-y-auto space-y-2 pr-1">
              {carrito.map((item) => (
                <div key={item.producto_id} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 truncate flex-1">{item.nombre}</span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => cambiarCantidad(item.producto_id, -1)} className="p-1 rounded bg-slate-800 text-slate-400">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-bold text-white w-4 text-center">{item.cantidad}</span>
                    <button type="button" onClick={() => agregarAlCarrito({ id: item.producto_id })} className="p-1 rounded bg-slate-800 text-slate-400">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-extrabold text-emerald-400 w-16 text-right">
                      ${(item.precio_cobrado_real * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="block w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">-- Consumidor Final --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre_apellido}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</label>
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEstadoCobro('Cobrada')}
                  className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition ${
                    estadoCobro === 'Cobrada' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Cobrada
                </button>
                <button
                  type="button"
                  onClick={() => setEstadoCobro('Pendiente')}
                  className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition ${
                    estadoCobro === 'Pendiente' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Deuda
                </button>
              </div>
            </div>
          </div>

          {error && <div className="text-xs text-rose-400 font-bold">{error}</div>}

          {/* Caja final */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-400">Total Venta:</span>
            <span className="text-2xl font-black text-emerald-400">${totalCarrito.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={isPending || carrito.length === 0}
            className="flex w-full justify-center items-center gap-2 rounded-xl bg-emerald-500 py-4 text-base font-bold text-slate-950 shadow-md hover:bg-emerald-400 disabled:opacity-50 transition"
          >
            <ShoppingCart className="h-5 w-5" />
            {isPending ? 'Confirmando...' : estadoCobro === 'Cobrada' ? 'Cobrar e Imprimir' : 'Registrar como Deuda'}
          </button>
        </form>
      </div>
    );
  }
  ```

---

### Task 7: Configuración Global, Costos e Inversiones
**Files:**
- Create: `src/app/config/page.tsx`
- Create: `src/components/ConfiguracionClient.tsx`

- [ ] **Step 1: Crear la Vista Principal de Configuración (`src/app/config/page.tsx`)**
  Escribir el contenedor asíncrono para renderizar inversiones (con amortización mensual), costos fijos y meta de producción global.
  ```typescript
  import React from 'react';
  import { getCostosFijos } from '@/infrastructure/actions/costos_fijos';
  import { getInversiones } from '@/infrastructure/actions/inversiones';
  import { getConfiguracion } from '@/infrastructure/actions/configuracion';
  import ConfiguracionClient from '@/components/ConfiguracionClient';

  export const revalidate = 0;

  export default async function ConfigPage() {
    const costosFijos = await getCostosFijos().catch(() => []);
    const inversiones = await getInversiones().catch(() => []);
    const config = await getConfiguracion().catch(() => []);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración del Negocio</h1>
          <p className="text-sm text-slate-400 mt-1">Gastos de estructura, amortizaciones y metas</p>
        </div>

        <ConfiguracionClient
          inicialCostosFijos={costosFijos}
          inicialInversiones={inversiones}
          inicialConfig={config}
        />
      </div>
    );
  }
  ```

---

## Verification Plan

### Automated Tests
- Correr la suite de pruebas unitarias y de integración para asegurar que las modificaciones de dependencias e importaciones no alteraron la robustez del negocio.
  Run: `npm run test:run`
  Expected: PASS

### Manual Verification
- **Autenticación (Middleware)**: Intentar entrar a `http://localhost:3000/` sin estar logueado. Verificar que redireccione correctamente a `/login`.
- **Panel de Inicio**: Verificar que se muestre el Dashboard con las tarjetas de Ventas Cobradas, Cuentas Pendientes y Costos Estructurales.
- **Flujo de Cocina**: Ir a `/cocina`, hacer clic en Registrar Cocina, elegir una receta (por ejemplo, Sorrentinos), verificar que cargue los ingredientes requeridos con mermas correctas, editar un valor, confirmar y verificar que el stock de insumos se actualice al instante.
- **Flujo de Ventas**: Ir a `/ventas`, abrir el Mostrador, seleccionar ítems, poner en estado "Cobrada", confirmar y validar que se actualice la tarjeta de ingresos mensuales del Dashboard.
