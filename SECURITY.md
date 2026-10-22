# Política de seguridad

Este sistema maneja **expedientes clínicos y recetas** de pacientes reales. Nos
tomamos en serio cualquier reporte, por pequeño que parezca.

## Versiones con soporte

| Versión | Soporte |
| --- | --- |
| `master` (última) | ✅ |
| Ramas antiguas y *forks* | ❌ |

## Cómo reportar una vulnerabilidad

**No abras un *issue* público ni un *pull request* con los detalles.** Un
reporte público le da la receta al atacante antes que el arreglo al equipo.

1. Ve a la pestaña **Security** de este repositorio.
2. Pulsa **Report a vulnerability** (reporte privado de GitHub).
3. Incluye, en la medida de lo posible:
   - qué componente o ruta está afectado (`/admin/...`, un servicio de `src/core/api`…);
   - los pasos para reproducirlo;
   - el impacto que ves (fuga de datos, escalada de rol, XSS…);
   - una propuesta de arreglo, si la tienes.

Si el formulario no estuviera disponible, contacta con el mantenedor por su
perfil de GitHub ([@JAbarca74](https://github.com/JAbarca74)) **pidiendo un canal
privado**, sin incluir los detalles en el primer mensaje.

## Qué puedes esperar

Es un proyecto académico mantenido por un equipo pequeño, así que los plazos
son orientativos:

- **Acuse de recibo:** en un máximo de 5 días hábiles.
- **Primera valoración:** en un máximo de 10 días hábiles.
- **Arreglo y aviso:** coordinado contigo; te daremos crédito en la nota del
  arreglo si lo deseas.

## Alcance

**Dentro del alcance:** el código de este repositorio (SPA en React) y su
interacción con la API: control de acceso por rol en el cliente, manejo del
token, inyección (XSS, inyección de fórmulas en CSV), cabeceras de seguridad y
dependencias.

**Fuera del alcance:**

- Las cuentas de demostración (`*@optica.local`) del entorno local: son públicas
  a propósito y solo existen en la base que crea `npm start` en tu equipo.
- Ataques de denegación de servicio, ingeniería social o pruebas contra
  infraestructura de terceros (GitHub, Vercel, Supabase).
- La API: tiene su propio repositorio y su propia política
  (`optica-semeraro-api`).

## Buenas prácticas que aplica el proyecto

- Ningún secreto vive en el código: el frontend solo lee `VITE_API_URL`, y todo
  lo que empiece por `VITE_` **termina en el bundle público**, así que nunca se
  usa para claves.
- `scripts/escanear-secretos.mjs` bloquea en el *pre-commit* y en CI cualquier
  cadena de conexión, `JWT_SECRET` o JWT incrustado.
- Cabeceras de seguridad en `vercel.json` (CSP `frame-ancestors`, HSTS,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- Análisis estático con CodeQL y actualizaciones de dependencias con Dependabot.

Gracias por ayudar a proteger los datos de los pacientes.
