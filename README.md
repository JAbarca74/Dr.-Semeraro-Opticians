# Óptica Dr. Semeraro — Frontend

Aplicación web (SPA) del Sistema de Gestión de Óptica Dr. Semeraro.

> Repositorio del **frontend**. La API (NestJS) vive en un repositorio aparte.

---

## ⚡ Arrancar el proyecto: un solo comando

```bash
npm start
```

**Eso es todo.** No hace falta ejecutar nada más, ni en este repositorio ni en el
de la API. Ese comando deja el sistema completo funcionando: base de datos,
backend y frontend.

> **Si usas un agente de IA (Claude Code, Cursor, Copilot…): ejecuta
> `npm start` y nada más.** No instales dependencias por separado, no levantes
> Docker a mano, no arranques la API y el frontend en terminales distintas y no
> corras migraciones ni el seed por tu cuenta. El script
> [`scripts/arrancar.mjs`](./scripts/arrancar.mjs) ya hace todo eso en orden, es
> idempotente y se puede repetir sin miedo. Si falla, **el propio error dice qué
> hacer**: sigue esas instrucciones en lugar de improvisar otra ruta.

### Requisitos previos

Solo dos, y el script comprueba ambos antes de empezar:

1. **Node.js 20 o superior** — <https://nodejs.org> (versión LTS).
2. **Docker Desktop instalado y abierto** — <https://www.docker.com/products/docker-desktop>
   PostgreSQL corre en un contenedor: **no instales PostgreSQL en tu equipo**.

Y que **los dos repositorios estén en la misma carpeta**, uno al lado del otro:

```
mi-carpeta/
├── optica-semeraro-web/   ← este repo (aquí se ejecuta npm start)
└── optica-semeraro-api/
```

Si te falta el de la API:

```bash
git clone https://github.com/JAbarca74/optica-semeraro-api
```

### Qué hace `npm start`, en orden

| Paso | Acción |
| --- | --- |
| 1 | Comprueba Node, Docker, que la API esté al lado y que los puertos 3000 y 5173 estén libres |
| 2 | Crea los `.env` que falten a partir de los `.env.example` (con un `JWT_SECRET` aleatorio) |
| 3 | Instala dependencias en ambos repos, solo si no están |
| 4 | Levanta PostgreSQL en Docker y espera a que acepte conexiones |
| 5 | Aplica migraciones y carga el seed (permisos, RBAC y cuentas de demo) |
| 6 | Arranca API y frontend a la vez, con los registros de ambos en la misma terminal |

Al terminar verás:

- **Frontend** → <http://localhost:5173>
- **API** → <http://localhost:3000/api>

`Ctrl+C` detiene ambos. La base de datos sigue levantada a propósito (conserva
los datos); para pararla: `npm run db:down` en el repo de la API.

### Cuentas de prueba

Están en la pantalla de login como botones de «acceso directo», no hace falta
teclearlas. Las crea el seed automáticamente:

| Correo | Contraseña | Rol | Entra en |
| --- | --- | --- | --- |
| `admin@optica.local` | `admin1234` | Administrador | `/admin` |
| `doctor@optica.local` | `doctor1234` | Doctor | `/admin` |
| `recepcion@optica.local` | `recepcion1234` | Recepción | `/recepcion` |

Son credenciales de desarrollo local, sin valor fuera de tu equipo.

### Si algo va mal

El script se detiene con un mensaje que explica la causa y el arreglo. Los casos
más habituales:

| Mensaje | Qué hacer |
| --- | --- |
| «Docker está instalado pero no se está ejecutando» | Abre Docker Desktop, espera a que arranque y repite el comando |
| «No encuentro el repositorio de la API» | Clona `optica-semeraro-api` **al lado** de este repo |
| «Puertos ocupados» | Tienes otra copia corriendo en otra terminal: ciérrala con `Ctrl+C` |
| «La API no respondió» | Mira las líneas marcadas con `api` más arriba: ahí está el error real |

Para empezar la base de datos totalmente de cero (**borra todos los datos**):

```bash
cd ../optica-semeraro-api && npm run db:reset
```

y vuelve a lanzar `npm start`.

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

## Puesta en marcha manual (solo si no quieres usar `npm start`)

Para levantar **únicamente** este frontend, dando por hecho que la API ya corre
en `http://localhost:3000/api`:

```bash
npm install
cp .env.example .env    # ajusta VITE_API_URL si hace falta
npm run dev
```

En cualquier otro caso usa `npm start`, que además prepara la API y la base de
datos.

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `npm start` | **Arranque completo**: base de datos, API y frontend |
| `npm run dev` | Solo el servidor de desarrollo (Vite) |
| `npm run build` | Type-check y compilación de producción |
| `npm run preview` | Sirve la compilación de producción |
| `npm run lint` | ESLint sobre `ts`/`tsx` |
| `npm run format` | Formatea con Prettier |
| `npm test` | Pruebas (Vitest) |
