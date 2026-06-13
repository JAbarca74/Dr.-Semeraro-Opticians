# Convenciones de código y de trabajo

Aplica a ambos repositorios (`optica-semeraro-api` y `optica-semeraro-web`).

## 1. Idioma

- **Identificadores** (variables, funciones, clases, archivos): **inglés** para
  los términos técnicos genéricos; **español** para los conceptos del dominio
  (p. ej. `Persona`, `Expediente`, `RecetaCriptografica`).
- **Comentarios y documentación:** español.

## 2. Nomenclatura

| Elemento | Convención | Ejemplo |
| --- | --- | --- |
| Variables y métodos | `camelCase` | `findByEmail`, `idUsuario` |
| Clases, tipos, componentes React | `PascalCase` | `UsuarioService`, `LoginPage` |
| Constantes globales | `UPPER_SNAKE_CASE` | `TOKEN_KEY` |
| Archivos backend (NestJS) | `kebab-case` por rol | `auth.service.ts`, `usuario.entity.ts` |
| Componentes React | `PascalCase.tsx` | `AdminLayout.tsx` |
| Tablas de BD | **singular** | `usuario`, `persona` |
| Columnas de BD | `snake_case` | `password_hash`, `created_at` |
| Llaves primarias | `id_<tabla>` | `id_usuario` |

## 3. Base de datos

- Diseño hasta la **Tercera Forma Normal (3FN)**.
- Integridad con `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`.
- Esquema **migrations-first** (TypeORM); nunca `synchronize: true`.

## 4. Estilo y formato

- **TypeScript** en modo `strict` en ambos repos.
- **Prettier:** comillas simples, comas finales (`trailingComma: all`).
- **EditorConfig:** UTF-8, indentación de 2 espacios, salto de línea final.
- Antes de confirmar: `npm run lint` (y `npm run format` si aplica) sin errores.

## 5. Estructura

- **Backend:** un módulo por dominio; dentro, capas `controller → service →
  repository`. Lo transversal vive en `common/`.
- **Frontend:** `core/` (servicios, guards, modelos), `features/` (una página por
  ruta), `layouts/` (shells público/privado) y `shared/` (reutilizables).

## 6. Control de versiones

- **Ramas:**
  - `master`: estable.
  - `sprint-<N>/<tema>`: trabajo del sprint (p. ej. `sprint-3/arquitectura-entorno`).
  - Se integra a `master` mediante Pull Request revisado.
- **Commits — [Conventional Commits](https://www.conventionalcommits.org/):**
  `tipo(alcance): descripción`. Tipos: `feat`, `fix`, `docs`, `refactor`,
  `test`, `chore`, `ci`, `style`.
  - Ejemplo: `feat(seguridad): agrega revocación de token (CU-01)`.

## 7. Integración Continua

Cada repositorio ejecuta en GitHub Actions, ante cada *push* y *pull request*,
la secuencia `lint → build → test`. No se integra a `master` con la CI en rojo.
