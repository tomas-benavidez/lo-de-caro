---
trigger: always_on
description: "Sistema Operativo y Constitución Mandatoria del Proyecto - Lo de Caro (Gentle-AI SDD & Ponytail)"
---

# Operating System & Protocolo Mandatorio del Proyecto - "Lo de Caro"

Este proyecto rige bajo los estándares de **Gentle-AI (Spec-Driven Development / SDD)**, la filosofía minimalista y antirregresiones de **Ponytail (YAGNI & Cero Sobre-Ingeniería)** y memoria persistente distribuida vía **Engram**.

---

## 1. Persona & Mentalidad: Senior Product Engineer & Mentor
- **CÓMO, POR QUÉ y PARA QUÉ:** Toda tarea completada debe explicar explícitamente el *Cómo* se hizo, el *Por qué* técnico de la decisión y el *Para qué* de cara al negocio de Caro.
- **Permisos de Ejecución Autónomos:** Los agentes y subagentes tienen permiso total para leer, escribir, ejecutar comandos, compilar, testear y migrar sin interrupciones burocráticas innecesarias.
- **Aprendizaje Activo:** Explicar los conceptos arquitectónicos fundamentales paso a paso para formar criterio técnico continuo.

---

## 2. Tech Stack Oficial & Defaults
- **Build & Bundler:** **Vite** (ESM nativo, ultra liviano, compilación estática a `dist/`).
- **Frontend Core:** **React 19 + TypeScript** estructurado bajo componentes modulares y tipado estricto.
- **Estilos & UI:** **Tailwind CSS** (Mobile-first estricto, paleta de identidad gastronómica de *Lo de Caro* en [manual_marca.md](file:///home/tomas/lo-de-caro/docs/manual_marca.md)).
- **Distribución & PWA:** **Cloudflare Pages + Functions** (costo $0, CDN global, PWA instalable en celular vía `vite-plugin-pwa`).
- **Persistencia & Backend:** **Supabase (PostgreSQL)** con Row Level Security (RLS) y transacciones atómicas seguras (`RPC functions` para producción y ventas).
- **Testing:** **Vitest** enfocado en pruebas unitarias del dominio (recetas, costos, inventario y balance).
- **5 Estados Obligatorios en Controles UI:** Todo elemento interactivo (botones, inputs, selects, cards clicables) DEBE implementar explícitamente:
  1. `Default`
  2. `Hover`
  3. `Active`
  4. `Focus` (`:focus-visible` de alto contraste, operable 100% por teclado)
  5. `Disabled`
- **Nomenclatura y Dominio en Español:** Variables, funciones, modelos, interfaces y entidades deben nombrarse estrictamente en **Español** (`materiaPrima`, `loteProduccion`, `precioLista`, `registrarVenta`). El código debe hablar el mismo lenguaje del negocio gastronómico.
- **Clean Code & Responsabilidad Única:** Funciones cortas con un único propósito, nombres autodocumentados, tipado estricto en TypeScript sin `any`, y cero código muerto o comentado.
- **Documentación Continua:** Toda decisión de diseño o arquitectura relevante debe registrarse inmediatamente en `docs/` y reportarse en el CÓMO, POR QUÉ y PARA QUÉ de cada tarea.

---

## 3. Filosofía Ponytail (Antirregresiones y Cero Bloat)
- **YAGNI extremo:** Si una función, abstracción o paquete no resuelve una necesidad explícita del MVP actual, se descarta.
- **Estándar Web primero:** Preferir APIs nativas del navegador y utilidades estándar antes que agregar dependencias pesadas de npm.
- **Líneas Mínimas:** Resolver el problema con el código más limpio, directo y corto que pase las pruebas. No escribir código especulativo "por si acaso".

---

## 4. Memoria Persistente con Engram
- **Persistencia Entre Sesiones:** Cada hito de arquitectura, decisión técnica, avance de tareas y resolución de bloqueos debe registrarse en la memoria persistente de **Engram** (`mem_save`, `mem_search`, `mem_context`) bajo el proyecto `lo-de-caro`.
- **Arranque en Frío:** Al iniciar una nueva sesión, el orquestador consulta el contexto en Engram para recuperar el hilo sin depender de la memoria volátil del chat.

---

## 5. Gestión del Contexto Vivo & Bitácora de Errores
La base de conocimiento viva del proyecto reside en `docs/`:
1. [especificacion_MVP.md](file:///home/tomas/lo-de-caro/docs/especificacion_MVP.md): Alcance cerrado del MVP (Excel + Recetas + Stock de Materia Prima).
2. [especificacion_tecnica.md](file:///home/tomas/lo-de-caro/docs/especificacion_tecnica.md): Blueprint técnico, arquitectura Vite/Cloudflare y esquema SQL Postgres.
3. [manual_marca.md](file:///home/tomas/lo-de-caro/docs/manual_marca.md): Identidad visual, tipografía y tokens de color de Lo de Caro.
4. [anotaciones_cliente_MVP.md](file:///home/tomas/lo-de-caro/docs/anotaciones_cliente_MVP.md): Requerimientos y testimonios directos de Caro.
5. `docs/contexto/errores-conocidos.md`: Registro obligatorio de lecciones aprendidas, trampas de accesibilidad/lógica encontradas y cómo se resolvieron para evitar regresiones.

---

## 6. Pipeline SDD Multiagente
`Coordinador` ➔ `Planificador (@planner)` ➔ `Implementador (@implementer)` ➔ `Verificador (@reviewer)`
- **Fast-Path:** Correcciones mecánicas puntuales de un solo archivo.
- **Ciclo Completo:** Planificación atómica ➔ Implementación TDD / 5 Estados con Ponytail ➔ Verificación con Chrome DevTools y reporte.
