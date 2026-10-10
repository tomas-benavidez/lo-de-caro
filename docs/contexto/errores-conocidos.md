# Bitácora de Errores Conocidos y Lecciones Aprendidas

Este documento es el registro vivo de trampas técnicas, errores encontrados y lecciones aprendidas durante el desarrollo de **"Lo de Caro"**. Su objetivo es servir como memoria antirregresiones para el equipo de desarrollo y los subagentes.

---

## Formato de Registro
Cada entrada debe documentar:
* **Fecha / Tarea:** Identificador de la tarea o momento en que ocurrió.
* **Síntoma / Error:** Qué falló o qué comportamiento inesperado se observó.
* **Causa Raíz:** Por qué ocurrió técnicamente.
* **Solución Aplicada:** Cómo se corrigió.
* **Regla Antirregresión:** Qué debemos chequear o evitar a futuro para que no vuelva a pasar.

---

## Entradas Registradas

### [2026-10-09] Conexión MCP de Supabase en CLI
* **Síntoma:** Error `HTTP 401 Unauthorized` al intentar conectar el endpoint de Supabase MCP por URL directa.
* **Causa Raíz:** El endpoint de `mcp.supabase.com/mcp` asume por defecto un flujo OAuth con navegador web interactivo, el cual no está disponible en la terminal pura (`agy`).
* **Solución Aplicada:** Se generó un Personal Access Token (PAT) con permisos de escritura en la cuenta de Supabase y se configuró como cabecera `Authorization: Bearer sbp_...` en `~/.gemini/config/mcp_config.json`.
* **Regla Antirregresión:** Para cualquier integración con Supabase en entornos de consola/CI/CD, utilizar cabeceras de autorización con PAT en lugar de depender de redirecciones OAuth del navegador.
