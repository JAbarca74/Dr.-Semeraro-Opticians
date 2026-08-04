# WBS — Estructura de Desglose de Trabajo

Descomposición jerárquica del alcance del Sistema de Gestión Óptica Dr. Semeraro.
Alineada con la Figura 3.2 del documento del proyecto (7 paquetes funcionales),
ampliada con los paquetes transversales de plataforma.

## 1. WBS del producto

```
Sistema de Gestión Óptica Dr. Semeraro
├─ A. Plataforma & Arquitectura (transversal)        ← Sprint 3
│   ├─ A1 Decisión de stack + ADRs
│   ├─ A2 Documento de arquitectura + diagramas
│   ├─ A3 WBS del producto
│   ├─ A4 Estándares y convenciones
│   ├─ A5 Entorno de desarrollo reproducible
│   ├─ A6 Saneamiento de configuración
│   ├─ A7 CI (lint + build + test)
│   └─ A8 README de arranque (uno por repositorio)
├─ B. Base de Datos & Modelo Relacional              ← Sprint 4
│   ├─ B1 Modelo relacional 3FN (entidades, relaciones, integridad)
│   ├─ B2 Migraciones de TypeORM
│   └─ B3 Carga inicial de datos (seeds)
├─ C. Seguridad: Autenticación, Usuarios y RBAC      ← Sprint 5
│   ├─ C1 Autenticación y control de sesión (CU-01)
│   ├─ C2 Gestión de usuarios y roles — RBAC (CU-18)
│   ├─ C3 Auditoría y logs (CU-08)
│   └─ C4 Separación pública/privada
├─ D. Expediente Clínico & Recetas Digitales         ← Sprint 6
│   ├─ D1 Expediente, ficha médica y notas de evolución (CU-02)
│   └─ D2 Recetas con QR y seguridad criptográfica (CU-16)
├─ E. Gestión de Citas (Agenda + WhatsApp)
├─ F. Control de Inventario
├─ G. Gestión de Ventas & Laboratorio
├─ H. Métricas e Indicadores
└─ I. Portal del Paciente + IA (biométrico / asistente)
```

## 2. WBS del Sprint 3 (Diseño, arquitectura y entorno)

| ID | Paquete de trabajo | Entregable |
| --- | --- | --- |
| A1 | Decisión de stack + ADRs | `docs/adr/0001..0003` |
| A2 | Arquitectura + diagramas | `docs/arquitectura.md` |
| A3 | WBS del producto | `docs/wbs.md` (este documento) |
| A4 | Estándares y convenciones | `docs/convenciones.md`, ESLint/Prettier/EditorConfig |
| A5 | Entorno reproducible | `.env.example`, scripts de arranque, conexión a BD |
| A6 | Saneamiento de configuración | CORS por env, filtro de excepciones, config Postgres |
| A7 | CI | `.github/workflows/ci.yml` en ambos repos |
| A8 | Documentación de arranque | `README.md` en cada repositorio. *El `CONTRIBUTING.md` se retiró del alcance el 2026-08-03: el proyecto lo desarrolla una sola persona y las convenciones viven en `docs/convenciones.md`.* |

## 3. Mapeo de casos de uso priorizados

| Caso de uso | Descripción | Sprint |
| --- | --- | --- |
| CU-01 | Autenticación y control de sesión | 5 |
| CU-18 | Gestión de usuarios y roles (RBAC) | 5 |
| CU-08 | Auditoría y logs | 5 |
| CU-02 | Expediente digital, ficha y evolución | 6 |
| CU-16 | Recetas con QR y firma criptográfica | 6 |
