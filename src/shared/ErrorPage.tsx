import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { MarcaOptica } from './MarcaOptica';

/**
 * Traduce el error del router a un mensaje que el usuario pueda entender.
 * Nunca muestra la traza: el detalle técnico va a la consola.
 */
const mensajeDeRuta = (error: unknown): string => {
  if (isRouteErrorResponse(error)) {
    return error.status === 404
      ? 'La página que busca no existe o cambió de dirección.'
      : `El servidor respondió con un error ${error.status}.`;
  }
  return 'Se produjo un error inesperado al mostrar esta página.';
};

/**
 * Pantalla de último recurso del router. Sin ella, cualquier error de render
 * dejaba la aplicación **en blanco y sin ningún aviso**, que es lo que hacía
 * invisible el bucle de redirección del rol Paciente.
 */
export const ErrorPage = () => {
  const error = useRouteError();
  // Deja rastro para depurar sin exponer la traza en pantalla.
  console.error('Error no controlado en el router:', error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-6 py-16 text-center dark:bg-[#0a0a0a]">
      <MarcaOptica />

      <span className="flex h-14 w-14 items-center justify-center border border-lux-tinta/40 text-lux-tinta">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />
      </span>

      <div className="space-y-3">
        <h1 className="font-serif text-3xl italic leading-none tracking-tight text-lux-blue dark:text-white md:text-4xl">
          Algo no salió como esperábamos
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {mensajeDeRuta(error)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="transition-luxe border border-lux-blue px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-lux-blue hover:bg-lux-blue hover:text-white dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-lux-blue"
        >
          Ir al inicio
        </Link>
        <Link
          to="/login"
          className="transition-luxe border border-neutral-200 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-500 hover:border-lux-tinta hover:text-lux-tinta dark:border-white/10 dark:text-neutral-400"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
};
