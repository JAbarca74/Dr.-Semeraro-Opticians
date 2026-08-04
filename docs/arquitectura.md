# Arquitectura del Sistema de Gestión — Óptica Dr. Semeraro

> Documento vivo. Refleja el estado del sistema al **2026-08-04**, tras los
> sprints 3 a 6. Las decisiones puntuales se registran como ADRs en
> [`docs/adr/`](./adr).

## 1. Visión general

Plataforma web centralizada construida bajo el patrón **Cliente–Servidor**, con
una separación estricta entre el **entorno público** (portal del paciente) y el
**entorno privado** (panel de gestión clínica y administrativa). Las dos partes
se comunican exclusivamente mediante una **API REST** modular.

```
                          ┌─────────────────────────────────────────────┐
   NAVEGADOR (SPA)        │   FRONTEND  React 18 + Vite + TypeScript      │
                          │  ┌─────────┐ ┌──────────┐ ┌──────────────┐   │
                          │  │ PÚBLICO │ │  /admin  │ │  /recepcion  │   │
                          │  │ (portal)│ │(gestión) │ │ (front desk) │   │
                          │  └─────────┘ └──────────┘ └──────────────┘   │
                          │   core (auth · api · guards · interceptores)  │
                          │   Tailwind CSS · React Router                 │
                          └───────────────┬─────────────────────────────┘
                                          │ HTTPS  ·  Authorization: Bearer JWT
                                          ▼
                          ┌─────────────────────────────────────────────┐
   API REST  /api         │   BACKEND  NestJS (monolito modular x dominio)│
                          │   Controller → Service → Repository (TypeORM) │
                          │   Transversal: JwtAuthGuard · RolesGuard ·    │
                          │   AllExceptionsFilter · ValidationPipe        │
                          └───────────────┬─────────────────────────────┘
                                          │ TypeORM (esquema por migraciones)
                                          ▼
                          ┌─────────────────────────────────────────────┐
   PERSISTENCIA           │   PostgreSQL (Supabase)                       │
                          │   3FN · PK/FK/UNIQUE/NOT NULL · auditoría     │
                          └─────────────────────────────────────────────┘
```

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
| --- | --- | --- |
| Frontend | **React 18 + Vite + TypeScript + Tailwind CSS** | SPA. Ver [ADR-0001](./adr/0001-stack-frontend-react.md). |
| Backend | **NestJS 10 (Node.js + TypeScript)** | Monolito modular por dominio. |
| ORM | **TypeORM 0.3** | Esquema gestionado por migraciones (`synchronize: false`). |
| Base de datos | **PostgreSQL** en **Supabase** | Ver [ADR-0002](./adr/0002-base-de-datos-postgresql.md). |
| Seguridad | **JWT + Passport + bcrypt**, RBAC | Enfoque Zero-Trust. |
| Validación | **class-validator / class-transformer** | `ValidationPipe` global con `whitelist`. |

## 3. Backend (NestJS)

### 3.1 Organización por dominios
Un módulo por dominio funcional, aislando las reglas de negocio:

```
src/
├── main.ts                 # Bootstrap: prefijo /api, CORS, ValidationPipe, filtro global
├── app.module.ts           # Conexión a BD + los 8 módulos de dominio
├── data-source.ts          # DataSource para la CLI de migraciones
├── config/                 # Conexión a BD (compartida app + CLI)
├── common/                 # Enums, decoradores, guards y filtros transversales
├── database/               # Migraciones y seeds
└── modules/
    ├── seguridad/          # Usuarios, RBAC, auditoría de acceso (CU-01/08/18)
    ├── personas/           # Pacientes y empleados
    ├── agenda/             # Disponibilidad, citas e historial
    ├── expedientes/        # Expediente clínico y recetas (CU-02/16)
    ├── inventario/         # Productos y movimientos
    ├── ventas/             # Ventas, detalle y órdenes de laboratorio
    ├── whatsapp-ia/        # Comunicación WhatsApp e interacción con IA
    └── sistema-central/    # Log de auditoría y configuración
```

### 3.2 Capas dentro de un módulo
`Controller` (HTTP + guards + DTOs) → `Service` (reglas de negocio) →
`Repository` (TypeORM). Las entidades modelan el esquema; los DTOs validan la
entrada.

### 3.3 Manejo de errores
`AllExceptionsFilter` global normaliza toda respuesta de error a
`{ statusCode, timestamp, path, message }` y registra los errores 5xx sin
filtrar detalles internos.

## 4. Frontend (React + Vite)

```
src/
├── main.tsx · App.tsx · router.tsx   # Entrada, providers y rutas
├── core/
│   ├── api/        # Instancia Axios + interceptores (Bearer / 401)
│   ├── auth/       # AuthContext, servicio de login, utilidades de token (JWT)
│   ├── guards/     # ProtectedRoute (sesión) y RoleRoute (RBAC real)
│   └── models/     # Tipos Rol y Usuario
├── layouts/        # PublicLayout · AdminLayout · ReceptionLayout
├── features/       # public/ · auth/ · admin/ · recepcion/ (una página por ruta)
└── shared/         # Componentes reutilizables y pantalla de error del router
```

- **Tres entornos:** un *layout* y una rama del árbol de rutas por cada uno
  (público, `/admin` y `/recepcion`).
- **RBAC real:** `RoleRoute` decodifica el JWT y verifica el rol (mejora sobre
  el esqueleto inicial, que solo comprobaba la sesión).
- **Sesión:** el token se decodifica para derivar el usuario; expiración y 401
  limpian la sesión. El backend **revalida la cuenta en cada petición**, así que
  desactivar a alguien o cambiarle el rol surte efecto de inmediato.
- **Errores:** el router declara un `errorElement`; un fallo de render muestra
  una pantalla de disculpa en vez de dejar la página en blanco.

## 5. Arquitectura de seguridad (Zero-Trust)

- **Autenticación sin estado (stateless):** JWT firmado; cada petición debe
  incluir un token válido. El backend no guarda sesiones en memoria.
- **RBAC en el servidor:** `JwtAuthGuard` + `RolesGuard` + `@Roles()`. Roles:
  `Administrador`, `Recepcion`, `Doctor`, `Paciente`.
- **Auditoría (CU-08):** implementada. `AuditInterceptor` escribe en
  `log_auditoria` las operaciones marcadas con `@Audit()` —con el valor anterior
  y el nuevo— y `bitacora_acceso` registra cada intento de acceso. El
  Administrador las consulta en `/admin/auditoria`.

## 6. Base de datos

- Motor **PostgreSQL**, diseño hasta la **3FN**.
- Convenciones: tablas en **singular**, columnas en `snake_case`, PK con formato
  `id_<tabla>`, integridad con `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`.
- **Migrations-first:** el esquema nunca se sincroniza automáticamente; se
  versiona con migraciones de TypeORM, ya aplicadas.
- **Desarrollo local:** `docker compose` levanta PostgreSQL 17 y
  `npm run db:setup` aplica migraciones y seed. Supabase queda para despliegue y
  demostraciones.

## 7. Entornos y configuración

| Repo | Variable | Propósito |
| --- | --- | --- |
| api | `DATABASE_URL` o `DB_*` | Conexión a PostgreSQL (Supabase o local). |
| api | `DB_SSL` | TLS (true en Supabase/nube). |
| api | `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y vigencia del token. |
| api | `CORS_ORIGIN` | Orígenes permitidos del frontend. |
| web | `VITE_API_URL` | URL base de la API. |

## 8. Despliegue (diferido)

La topología objetivo (Frontend en Firebase Hosting, Backend en contenedor sobre
Render/Railway, BD en Supabase) se documenta pero **no se implementa en el
Sprint 3**. Ver [ADR-0003](./adr/0003-despliegue-diferido.md).

## 9. Alcance futuro

- **IA descentralizada** (CU-18/19): análisis biométrico en el navegador
  (TensorFlow.js) y asistente vía microservicio/MCP.
- **Módulos con interfaz pero sin datos:** agenda, inventario, ventas,
  laboratorio, métricas y el registro público de pacientes.

> **Ya implementado** y antes listado aquí: las **recetas criptográficas**
> (CU-16), con hash SHA-256, QR, PDF y verificación pública.
