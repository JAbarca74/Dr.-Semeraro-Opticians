# Óptica Dr. Semeraro — Frontend

Aplicación web (SPA) del Sistema de Gestión de Óptica Dr. Semeraro.

## Activación de cuentas de pacientes

Desde el 18/10/2026, `/registro` explica el acceso por invitación y
`/activar-cuenta` permite definir la contraseña usando el enlace del correo.
El alta pública directa está cerrada. Inicio, catálogo e información del doctor
siguen siendo públicos; `/portal` y `/pedidos` requieren sesión de Paciente.
La verificación pública de recetas se conserva en `/validar-receta` y
`/verificar/:hash`.

Para probar después de actualizar ambos repositorios:

1. Ejecuta `npm start` aquí. Comprueba las dependencias, inicia PostgreSQL y
   Mailpit y aplica las migraciones de la API.
2. Entra como Doctor o Recepción y registra una ficha con correo. En Recepción,
   se hace desde la agenda, al seleccionar un cupo y «Nuevo paciente».
3. Abre [Mailpit](http://localhost:8025), entra al mensaje del paciente y abre
   el enlace de activación. Es un buzón de desarrollo; no envía correos reales.
4. Define y confirma la contraseña; después inicia sesión con ese correo.
5. Si falta el correo o falla el envío, selecciona al paciente en la cita:
   allí puedes consultar el estado, guardar el correo o reenviar la invitación.
   Doctor también puede consultar/reintentar al editar la ficha en Pacientes.

El enlace vence en 24 horas y funciona una sola vez. Reenviarlo invalida el
anterior. No se solicita una contraseña al personal. Para envíos reales hace
falta configurar un proveedor SMTP en la API; las variables están documentadas
en su README y `.env.example`. Las cuentas existentes conservan su acceso.

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

1. **Node.js 24** — <https://nodejs.org> (misma versión mayor que utiliza CI).
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

### ⏳ Ten paciencia con la API: tarda ~1 minuto en responder

**Este es el problema que más confunde y no es un fallo.** El frontend queda
listo en **~1 segundo**, pero la API arranca en dos tiempos:

| Momento | Qué pasa | El navegador |
| --- | --- | --- |
| 0 s | Vite sirve el frontend | la página **ya carga** |
| 0 – ~50 s | Nest **compila TypeScript** antes de escuchar | el puerto 3000 **no existe todavía** |
| ~50 s | `Nest application successfully started` | a partir de aquí todo responde |

Si abres la página durante esa ventana, la consola del navegador te dará:

```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:3000/api/configuracion/publicos:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**No toques nada.** Espera a ver en la terminal la línea:

```
[Nest] LOG [NestApplication] Nest application successfully started
```

y **recarga la página** (`Ctrl`+`Shift`+`R`).

> ⚠️ **La consola del navegador no se limpia sola al navegar.** Los errores de
> la ventana de arranque **siguen listados** aunque la aplicación ya funcione, y
> parecen un fallo actual. Antes de reportar un `ERR_CONNECTION_REFUSED`, limpia
> la consola (🚫 en DevTools) o recarga, y comprueba si vuelve a salir.

Para saber si la API está viva sin adivinar:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/catalogo
```

`200` = lista. `000` = todavía no escucha (sigue compilando, o no arrancó).

### Cuentas de prueba

Están en la pantalla de login como botones de «acceso directo», no hace falta
teclearlas. Las crea el seed automáticamente:

| Correo | Contraseña | Rol | Entra en |
| --- | --- | --- | --- |
| `admin@optica.local` | `admin1234` | Administrador | `/admin` |
| `doctor@optica.local` | `doctor1234` | Doctor | `/admin` |
| `recepcion@optica.local` | `recepcion1234` | Recepción | `/recepcion` |
| `paciente@optica.local` | `paciente1234` | Paciente | `/portal` |

Son credenciales de desarrollo local, sin valor fuera de tu equipo.

Cada rol ve **un menú distinto**: el Doctor no entra a bodega, ventas, métricas,
usuarios ni auditoría, y Recepción no entra a `/admin`. Si escribes a mano una
ruta que tu rol no tiene, la aplicación **te devuelve a tu panel**: es el
comportamiento correcto, no un error.

### Si algo va mal

El script se detiene con un mensaje que explica la causa y el arreglo. Los casos
más habituales:

| Mensaje | Qué hacer |
| --- | --- |
| «Docker está instalado pero no se está ejecutando» | Abre Docker Desktop, espera a que arranque y repite el comando |
| «No encuentro el repositorio de la API» | Clona `optica-semeraro-api` **al lado** de este repo |
| «Puertos ocupados» | Tienes otra copia corriendo en otra terminal: ciérrala con `Ctrl+C` |
| «La API no respondió» | Mira las líneas marcadas con `api` más arriba: ahí está el error real |
| `ERR_CONNECTION_REFUSED` en `/api/…` **al abrir la página** | La API aún no escucha. Espera el mensaje de arranque y recarga: ver [la sección de arriba](#-ten-paciencia-con-la-api-tarda-1-minuto-en-responder) |
| `ERR_CONNECTION_REFUSED` **con la API ya arrancada** | Tu pestaña no está en el 5173. La build de producción (`npm run preview`, :4173) **no puede iniciar sesión**: el `CORS_ORIGIN` de la API apunta al 5173 |
| La API arranca y **muere** con un error de conexión a la base | Estás apuntando a Supabase en vez de a Docker: ver el aviso de abajo |

Para empezar la base de datos totalmente de cero (**borra todos los datos**):

```bash
cd ../optica-semeraro-api && npm run db:reset
```

y vuelve a lanzar `npm start`.

### 🐘 Dos bases posibles: usa siempre la de Docker

La API puede apuntar a dos sitios distintos, y **elegir mal es la causa más
común de «a mí no me arranca»**:

| Comando en la API | Archivo que lee | Base de datos |
| --- | --- | --- |
| `npm run start:dev:local` | `.env.local` | **PostgreSQL en Docker** ✅ el que usa `npm start` |
| `npm run start:dev` | `.env` | Supabase (nube) |

El proyecto de Supabase está en plan gratuito y **se pausa por inactividad**;
cuando eso pasa, `npm run start:dev` no levanta y el frontend responde con
`ERR_CONNECTION_REFUSED` en cada petición. La base de Docker no se pausa nunca.

**Para desarrollar, usa siempre la de Docker** — que es justo lo que hace
`npm start`, sin que tengas que pensarlo.

### Arranque en dos terminales (si prefieres ver los registros por separado)

`npm start` mezcla los registros de API y frontend en una sola terminal. Si
quieres separarlos:

```bash
# Terminal 1 — base de datos + API
cd optica-semeraro-api
npm run db:setup        # Docker + migraciones + seed (idempotente)
npm run start:dev:local # espera el "Nest application successfully started"
```

```bash
# Terminal 2 — frontend
cd optica-semeraro-web
npm run dev
```

El orden importa poco (el frontend aguanta que la API llegue después), pero
**no abras el navegador hasta que la API haya arrancado** o verás los errores de
consola de la sección anterior.

## Tecnologías

- **React 18 + Vite + TypeScript**.
- **Tailwind CSS** para los estilos.
- **React Router** para el enrutamiento (separación público/privado).
- **Axios** con interceptor JWT para consumir la API REST.
- Control de acceso por **RBAC** mediante guards de ruta.

## Documentación

La documentación del curso (arquitectura, WBS, convenciones y ADRs) **ya no se
versiona en este repositorio** desde el 2026-09-15: vive en la carpeta `docs/`,
que está en `.gitignore` y se entrega por fuera del repo. El repositorio guarda
solo lo necesario para construir, probar y desplegar, más este `README.md`.

Si clonaste el repo y no ves `docs/`, **no te falta nada**: pídesela al equipo.

## Estructura

```
src/
├── main.tsx · App.tsx · router.tsx   # Entrada, providers y rutas
├── core/
│   ├── api/        # Instancia Axios + interceptores (Bearer / 401) y servicios
│   ├── auth/       # AuthContext, login, utilidades de token (JWT)
│   ├── guards/     # ProtectedRoute (sesión) y RoleRoute (RBAC)
│   ├── i18n/       # Catálogos tipados es · en · it y selector de idioma
│   └── models/     # Tipos del dominio (Rol, Usuario, Venta, Inventario…)
├── layouts/        # PublicLayout · AdminLayout · ReceptionLayout
├── features/       # public/ · auth/ · admin/ · recepcion/ (una página por ruta)
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
