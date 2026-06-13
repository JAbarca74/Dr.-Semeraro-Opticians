# Guía de contribución

Aplica a los dos repositorios del proyecto (`optica-semeraro-api` y
`optica-semeraro-web`). Resume el flujo de trabajo; el detalle de estilo está en
[`docs/convenciones.md`](./docs/convenciones.md).

## Flujo de trabajo (Scrum)

El proyecto avanza **sprint por sprint**. Cada sprint se planifica antes de
escribir código y se valida contra su *Definition of Done* antes de cerrarse.

## Ramas

- `master`: rama estable.
- `sprint-<N>/<tema>`: trabajo del sprint (ej. `sprint-3/arquitectura-entorno`).
- La integración a `master` se hace mediante **Pull Request** revisado, con la CI
  en verde.

## Commits — Conventional Commits

Formato: `tipo(alcance): descripción`.

- Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `style`.
- Ejemplos:
  - `feat(seguridad): agrega revocación de token (CU-01)`
  - `docs(arquitectura): documenta separación pública/privada`

## Antes de abrir un Pull Request

Ejecutar localmente, sin errores:

```bash
npm run lint
npm run build
npm test
```

La CI (GitHub Actions) repite `lint → build → test` en cada *push* y *pull
request*. No se integra a `master` con la CI en rojo.

## Estilo

- TypeScript en modo `strict`.
- Prettier (comillas simples, comas finales) + EditorConfig (2 espacios, UTF-8).
- Nomenclatura y convenciones de base de datos: ver
  [`docs/convenciones.md`](./docs/convenciones.md).
