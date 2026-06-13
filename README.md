# Óptica Dr. Semeraro — Frontend

Aplicación web (SPA) del Sistema de Gestión de Óptica Dr. Semeraro.

> Repositorio del **frontend**. La API (NestJS) vive en un repositorio aparte.

## Tecnologías

- **React 18 + Vite + TypeScript**.
- **Tailwind CSS** para los estilos.
- **React Router** para el enrutamiento (separación público/privado).
- **Axios** con interceptor JWT para consumir la API REST.
- Control de acceso por **RBAC** mediante guards de ruta.

## Documentación

- [Arquitectura del sistema](./docs/arquitectura.md)
- [WBS](./docs/wbs.md) · [Convenciones](./docs/convenciones.md)
- [Decisiones de arquitectura (ADRs)](./docs/adr)

## Estructura

```
src/
├── main.tsx · App.tsx · router.tsx   # Entrada, providers y rutas
├── core/
│   ├── api/        # Instancia Axios + interceptores (Bearer / 401)
│   ├── auth/       # AuthContext, login, utilidades de token (JWT)
│   ├── guards/     # ProtectedRoute (sesión) y RoleRoute (RBAC)
│   └── models/     # Tipos Rol y Usuario
├── layouts/        # PublicLayout (portal) y AdminLayout (panel)
├── features/       # public/ · auth/ · admin/ (una página por ruta)
└── shared/         # Componentes reutilizables
```

## Requisitos

- Node.js 20+
- El backend (API) en ejecución para las funciones que consumen datos.

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar la URL de la API:
   ```bash
   cp .env.example .env
   ```
   Ajustar `VITE_API_URL` (por defecto `http://localhost:3000/api`).
3. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir `http://localhost:5173`.

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Type-check y compilación de producción |
| `npm run preview` | Sirve la compilación de producción |
| `npm run lint` | ESLint sobre `ts`/`tsx` |
| `npm run format` | Formatea con Prettier |
| `npm test` | Pruebas (Vitest) |
