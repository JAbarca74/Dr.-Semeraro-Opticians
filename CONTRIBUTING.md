# Cómo contribuir

¡Gracias por tu interés en el Sistema de Gestión de Óptica Dr. Semeraro! Esta
guía explica cómo proponer cambios sin romper nada y, sobre todo, **sin exponer
datos ni secretos**.

Al participar aceptas el [Código de conducta](./CODE_OF_CONDUCT.md).

## Antes de empezar

- **¿Encontraste una vulnerabilidad?** No abras un *issue*: sigue la
  [Política de seguridad](./SECURITY.md).
- **¿Un error o una idea?** Busca primero entre los *issues* abiertos y, si no
  existe, abre uno con la plantilla correspondiente.
- **¿Un cambio grande?** Abre un *issue* para comentarlo antes de escribir
  código. Es un proyecto académico con un alcance documentado: puede que la
  funcionalidad exista en otra forma o que quede fuera del alcance.

## Preparar el entorno

Necesitas **Node.js 24** y **Docker Desktop**, y los dos repositorios uno al
lado del otro:

```bash
git clone https://github.com/JAbarca74/optica-semeraro-web
git clone https://github.com/JAbarca74/optica-semeraro-api
cd optica-semeraro-web
npm start
```

`npm start` crea los `.env` locales, levanta PostgreSQL en Docker, aplica
migraciones y arranca API y frontend. Detalle completo en el
[README](./README.md#-inicio-rápido).

## Flujo de trabajo

1. Haz un *fork* y crea una rama desde `master`:
   `feat/descripcion-corta`, `fix/descripcion-corta` o `docs/…`.
2. Haz commits pequeños con [Conventional Commits](https://www.conventionalcommits.org):
   `feat: …`, `fix: …`, `test: …`, `docs: …`, `chore: …`.
3. Antes de abrir el PR, ejecuta lo mismo que CI:

   ```bash
   npm run seguridad:secretos
   npm run lint
   npm run build
   npm run test:coverage
   ```

4. Abre el *pull request* contra `master` y completa la plantilla.

## Convenciones del código

- **TypeScript estricto.** Nada de `any` sin justificar.
- **Textos de la interfaz, comentarios y mensajes de validación en español**,
  con tildes. Todo texto visible pasa por `core/i18n`: los catálogos son
  tipados, así que un texto sin traducir al inglés y al italiano **no compila**.
- Estilos con **Tailwind**; los colores salen del tema, no de valores sueltos.
- Una página por ruta en `src/features/`; lo reutilizable va a `src/shared/`.
- La lógica de `core/` y `shared/` se mantiene con **100 % de cobertura** (lo
  exige CI). Si añades lógica, añade su prueba.
- Respeta `prefers-reduced-motion` en cualquier animación nueva.

## Seguridad: reglas no negociables

- **Nunca** subas un `.env`, contraseñas, tokens ni volcados de base de datos.
  Solo se versiona `.env.example`, con valores de ejemplo.
- Nada que empiece por `VITE_` es secreto: Vite lo incrusta en el bundle que
  descarga cualquier visitante.
- **Nunca** uses datos reales de pacientes en pruebas, capturas o *issues*.
  Usa los datos ficticios del seed.
- El *hook* de *pre-commit* escanea secretos; no lo saltes con `--no-verify`.

Si subiste un secreto por error, **avisa de inmediato** por el canal privado de
[SECURITY.md](./SECURITY.md): borrar el commit no basta, hay que rotarlo.

## Revisión

Cada PR necesita CI en verde y la aprobación de un mantenedor. Puede que te
pidamos cambios: es parte normal del proceso, no un rechazo.
