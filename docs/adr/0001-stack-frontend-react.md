# ADR-0001 — Framework de frontend: React 18

- **Estado:** Aceptada (2026-06-12)
- **Contexto del sprint:** Sprint 3 (Diseño, arquitectura y entorno)

## Contexto

El documento del proyecto (sección 4.1) especifica la capa de presentación como
una **SPA en React 18 + TypeScript + Tailwind CSS**, alojable como sitio estático.
Sin embargo, el *scaffold* inicial del repositorio `optica-semeraro-web` se había
generado en **Angular 17**. Existía, por tanto, una contradicción entre la
documentación evaluable y el código.

Al no existir aún lógica de negocio ni componentes reales (solo el esqueleto),
el costo de realinear el código a la documentación era bajo.

## Decisión

Adoptar **React 18 + Vite + TypeScript + Tailwind CSS** como stack del frontend,
reemplazando el *scaffold* Angular. Se utiliza **Vite** por su rapidez y porque
produce una SPA estática idónea para hosting en CDN (p. ej. Firebase Hosting).
El enrutamiento usa **React Router**; el estado de sesión, **React Context**.

## Consecuencias

- **Positivas:** el código queda alineado con el documento; SPA ligera y rápida;
  ecosistema amplio; despliegue estático sencillo.
- **Negativas / costos:** se descarta el *scaffold* Angular; el equipo asume las
  convenciones de React (componentes funcionales, hooks).
- **Seguimiento:** la UI premium (design system) se aborda en un sprint de
  interfaz posterior; el Sprint 3 entrega solo la estructura y la navegación.
