# Óptica Dr. Semeraro — Frontend

Aplicación web del Sistema de Gestión de Óptica Dr. Semeraro.

> Repositorio del **frontend**. La API (NestJS) vive en un repositorio aparte.

## Tecnologías

- **Angular 17** con componentes *standalone* (sin NgModules).
- **Diseño Web Responsivo (RWD)**.
- Consumo de la API REST mediante `HttpClient` con interceptor JWT.
- Control de rutas con guards (**RBAC**).

## Estructura

```
src/app/
├── app.component.ts        # Componente raíz
├── app.config.ts           # Providers (router + HttpClient + interceptor)
├── app.routes.ts           # Rutas: entorno público y entorno /admin privado
├── core/                   # Servicios, guards, interceptor y modelos transversales
│   ├── services/           # auth.service, api.service
│   ├── guards/             # authGuard, roleGuard
│   ├── interceptors/       # authInterceptor (adjunta el token JWT)
│   └── models/             # Rol, Usuario
└── features/
    ├── public/             # Portal del paciente (home, catálogo, especialista, pedidos, registro)
    ├── auth/               # Inicio de sesión
    └── admin/              # Panel administrativo (un componente por módulo)
```

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Levantar el servidor de desarrollo:
   ```bash
   npm start
   ```
3. Abrir `http://localhost:4200`.

> Requiere el backend en ejecución. La URL de la API se configura en
> `src/environments/environment.ts` (`apiUrl`).
