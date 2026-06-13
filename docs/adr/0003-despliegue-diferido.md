# ADR-0003 — Despliegue diferido; Sprint 3 entrega entorno local + CI

- **Estado:** Aceptada (2026-06-12)
- **Contexto del sprint:** Sprint 3 (Diseño, arquitectura y entorno)

## Contexto

El documento describe una estrategia DevOps con el frontend en **Firebase
Hosting**, el backend **contenerizado (Docker)** sobre Render/Railway y la base
de datos en **Supabase**. El alcance acordado para el Sprint 3 es, sin embargo,
**entorno de desarrollo local reproducible + CI básica**, sin contenerización ni
despliegue en producción todavía.

## Decisión

Diferir la contenerización y el despliegue. En el Sprint 3 se entrega:

- Arranque local reproducible de ambos repositorios (documentado en los README).
- **Integración Continua** con GitHub Actions: `lint + build + test` por repo.

La topología de despliegue objetivo queda **documentada** en
[`arquitectura.md`](../arquitectura.md) para retomarse en un sprint de
infraestructura posterior.

## Consecuencias

- **Positivas:** el Sprint 3 se concentra en arquitectura y entorno, sin la
  complejidad del despliegue; la CI protege la calidad desde el inicio.
- **Negativas:** no hay entorno desplegado aún; el despliegue (Docker, Firebase,
  Supabase de producción) es trabajo pendiente explícito.
