# ADR-0002 — Motor de base de datos: PostgreSQL (Supabase)

- **Estado:** Aceptada (2026-06-12)
- **Contexto del sprint:** Sprint 3 (Diseño, arquitectura y entorno)

## Contexto

La sección 4.1/4.3 del documento define la capa de persistencia como
**PostgreSQL alojado en Supabase**, con diseño hasta la 3FN. El *scaffold*
inicial del backend, en cambio, estaba configurado para **MySQL** (`mysql2`).

Como aún no existía **ninguna migración**, el esquema no estaba materializado y
el costo de cambiar de motor era mínimo (ajuste de driver, configuración y tipos
de columna).

## Decisión

Usar **PostgreSQL** mediante **TypeORM** (driver `pg`), con **Supabase** como
destino gestionado (hosting + respaldos + TLS). El esquema se mantiene
**migrations-first** (`synchronize: false`).

La conexión se centraliza en `src/config/typeorm-base.config.ts`, compartida por
la aplicación NestJS y la CLI de migraciones, y admite dos modos:
`DATABASE_URL` (recomendado para Supabase) o variables discretas `DB_*` (local).

## Consecuencias

- **Ajustes de tipos aplicados:** `datetime → timestamptz`, `json → jsonb`,
  `tinyint → smallint`. Los `enum` se mantienen como enums nativos de PostgreSQL.
- **Positivas:** alineación con el documento; respaldos y TLS de grado gestionado
  vía Supabase; `jsonb`/`timestamptz` son tipos más ricos que sus equivalentes.
- **Costos / dependencias:** para desarrollo se requiere un PostgreSQL local o
  credenciales de Supabase; la verificación de conexión en vivo depende de ello.
