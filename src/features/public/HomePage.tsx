import { Link } from 'react-router-dom';

export const HomePage = () => (
  <section className="max-w-2xl">
    <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
      Salud visual integral en Pérez Zeledón
    </h1>
    <p className="mt-4 text-lg text-slate-600">
      Cuidado ocular primario, optometría pediátrica y adaptación de lentes de
      contacto con seguimiento clínico personalizado.
    </p>
    <div className="mt-8 flex gap-4">
      <Link
        to="/catalogo"
        className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
      >
        Ver catálogo
      </Link>
      <Link
        to="/especialista"
        className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-100"
      >
        Conocer al especialista
      </Link>
    </div>
  </section>
);
